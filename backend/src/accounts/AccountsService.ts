import {HttpException, HttpStatus, Injectable} from "@nestjs/common";
import uuid from "uuid/v4";
import {LoggerService} from "nest-logger";
import {AccountsRepository} from "./AccountsRepository";
import {accountToAccountResponse} from "./account-mappers";
import {AccountType} from "./types";
import {
    AccountResponse,
    BalanceResponse,
    BalancesResponse,
    DataOwnersOfDataValidatorResponse,
    LambdaTransactionResponse,
    LambdaTransactionType
} from "./types/response";
import {CreateDataValidatorRequest, ICreateDataOwnerRequest, WithdrawFundsRequest} from "./types/request";
import {NoAccountsRegisteredException} from "./NoAccountsRegisteredException";
import {RegisterAccountRequest, ServiceNodeApiClient} from "../service-node-api";
import {EntityType} from "../nedb/entity";
import {Web3Wrapper} from "../web3";
import {AccountRegistrationStatusResponse} from "../service-node-api/types/response";
import {User} from "./types/entity";
import {WalletGeneratorApiClient} from "../wallet-generator/WalletGeneratorApiClient";
import {UsersRepository} from "./UsersRepository";
import {BCryptPasswordEncoder} from "../bcrypt";
import {CurrentAccountResponse} from "./types/response/CurrentAccountResponse";
import {AuthService} from "../jwt-auth/AuthService";
import {AccessTokenResponse} from "../jwt-auth/types/response";
import {config} from "../config";

@Injectable()
export class AccountsService {
    constructor(private readonly accountsRepository: AccountsRepository,
                private readonly usersRepository: UsersRepository,
                private readonly serviceNodeClient: ServiceNodeApiClient,
                private readonly walletGeneratorApiClient: WalletGeneratorApiClient,
                private readonly passwordEncoder: BCryptPasswordEncoder,
                private readonly web3Wrapper: Web3Wrapper,
                private readonly authService: AuthService,
                private readonly log: LoggerService) {
    }

    public async createDataValidatorAccount(createDataValidatorAccountRequest: CreateDataValidatorRequest): Promise<void | (CurrentAccountResponse & AccessTokenResponse)> {

        if (!createDataValidatorAccountRequest.address && !createDataValidatorAccountRequest.lambdaWallet) {
            throw new HttpException(
                `Either lambdaWallet or address properties must be specified`,
                HttpStatus.BAD_REQUEST
            );
        }

        try {
            const defaultAccount: boolean = (await this.accountsRepository.findAll()).filter(account => account.default).length === 0;

            let userId: string | undefined;
            let user: User | undefined;

            if (createDataValidatorAccountRequest.lambdaWallet) {
                user = await this.usersRepository.findByLambdaWallet(createDataValidatorAccountRequest.lambdaWallet);

                if (user) {
                    throw new HttpException(
                        `Lambda wallet ${createDataValidatorAccountRequest.lambdaWallet} is already in use`,
                        HttpStatus.CONFLICT
                    );
                } else {
                    const accountRegistrationStatus = (
                        await this.serviceNodeClient.isLambdaWalletRegistered(createDataValidatorAccountRequest.lambdaWallet)
                    ).data;

                    if (accountRegistrationStatus.registered) {
                        throw new HttpException(
                            `Lambda wallet ${createDataValidatorAccountRequest.lambdaWallet} is already in use`,
                            HttpStatus.CONFLICT
                        );
                    }

                    user = {
                        _id: uuid(),
                        _type: EntityType.USER,
                        lambdaWallet: createDataValidatorAccountRequest.lambdaWallet,
                        passwordHash: await this.passwordEncoder.encode(createDataValidatorAccountRequest.password)
                    };
                    userId = user._id;
                }
            }

            if (!createDataValidatorAccountRequest.address) {
                const wallet = await this.walletGeneratorApiClient.generateWallet();
                createDataValidatorAccountRequest.address = wallet.address;
                createDataValidatorAccountRequest.privateKey = wallet.privateKey;
            }

            const accountRegistrationStatusResponse: AccountRegistrationStatusResponse = (
                await this.serviceNodeClient.isAccountRegistered(createDataValidatorAccountRequest.address)
            ).data;

            if (accountRegistrationStatusResponse.registered) {
                if (accountRegistrationStatusResponse.role === AccountType.DATA_VALIDATOR) {
                    await this.accountsRepository.save({
                        address: createDataValidatorAccountRequest.address,
                        privateKey: createDataValidatorAccountRequest.privateKey,
                        _type: EntityType.ACCOUNT,
                        default: defaultAccount
                    });
                    return;
                } else {
                    throw new HttpException(
                        `Account with ${createDataValidatorAccountRequest.address} has already been registered and it's not data validator`,
                        HttpStatus.CONFLICT
                    );
                }
            }

            const registerAccountRequest: RegisterAccountRequest = {
                address: createDataValidatorAccountRequest.address,
                type: AccountType.DATA_VALIDATOR,
                lambdaWallet: createDataValidatorAccountRequest.lambdaWallet,
                signature: null
            };
            registerAccountRequest.signature = this.web3Wrapper.signData(registerAccountRequest, createDataValidatorAccountRequest.privateKey);
            await this.serviceNodeClient.registerAccount(registerAccountRequest);

            if (user) {
                await this.usersRepository.save(user);
            }

            const account = await this.accountsRepository.save({
                address: createDataValidatorAccountRequest.address,
                privateKey: createDataValidatorAccountRequest.privateKey,
                _type: EntityType.ACCOUNT,
                default: defaultAccount,
                userId
            });

            if (user) {
                const {accessToken} = await this.authService.login(user);

                return {
                    ethereumAddress: account.address,
                    lambdaAddress: user.lambdaWallet,
                    accessToken
                };
            }
        } catch (error) {
            console.log(error);
            if (error instanceof HttpException) {
                throw error;
            }

            if (error.response) {
                if (error.response.status === 400) {
                    throw new HttpException(
                        `Account with address ${createDataValidatorAccountRequest.address} has already been registered`,
                        HttpStatus.BAD_REQUEST
                    )
                }
                // tslint:disable-next-line:max-line-length
                throw new HttpException(`Error occurred when tried to create data validator. Service node responded with ${error.status} status`, HttpStatus.INTERNAL_SERVER_ERROR);
            } else {
                throw new HttpException("Service node is unreachable", HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
    }

    public async getAllAccounts(): Promise<AccountResponse[]> {
        return (await this.accountsRepository.findAll()).map(account => accountToAccountResponse(account));
    }

    public async createDataOwner(createDataOwnerRequest: ICreateDataOwnerRequest): Promise<DataOwnersOfDataValidatorResponse> {
        try {
            return (await this.serviceNodeClient.registerDataOwner(createDataOwnerRequest)).data;
        } catch (error) {
            if (error.response) {
                throw new HttpException(
                    `Could not create data owner, service node responded with ${error.response.status} status`,
                    HttpStatus.INTERNAL_SERVER_ERROR
                );
            } else {
                throw new HttpException("Service node is unreachable", HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
    }

    public async getBalanceOfAccount(address: string): Promise<BalanceResponse> {
        try {
            return (await this.serviceNodeClient.getBalanceOfAccount(address)).data;
        } catch (error) {
            if (error.response) {
                throw new HttpException(
                    `Could not get balance of account, service node responded with ${error.response.status} status`,
                    HttpStatus.INTERNAL_SERVER_ERROR
                );
            } else {
                throw new HttpException("Service node is unreachable", HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
    }

    public async getDataOwnersOfDataValidator(dataValidatorAddress: string): Promise<DataOwnersOfDataValidatorResponse> {
        try {
            return (await this.serviceNodeClient.getDataOwnersOfDataValidator(dataValidatorAddress)).data;
        } catch (error) {
            if (error.response) {
                throw new HttpException(
                    `Could not get data owners of data validator, service node responded with ${error.response.status} status`,
                    HttpStatus.INTERNAL_SERVER_ERROR
                )
            } else {
                throw new HttpException("Service node is unreachable", HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
    }

    public async getBalancesOfAllAccounts(): Promise<BalancesResponse> {
        return this.accountsRepository.findAll().then(accounts => {
            const result: {[address: string]: number} = {};
            return Promise.all(accounts.map(async account => ({
                address: account.address,
                balance: (await this.getBalanceOfAccount(account.address)).balance
            })))
                .then(balances => {
                    balances.forEach(balance => result[balance.address] = balance.balance);
                    return result;
                })
        })
    }

    public async setAccountDefaultAccount(address: string): Promise<AccountResponse> {
        const account = await this.accountsRepository.findByAddress(address);

        if (!account) {
            throw new HttpException(
                `Could not find account with address ${address}`,
                HttpStatus.NOT_FOUND
            )
        }

        account.default = true;

        return accountToAccountResponse(await this.accountsRepository.save(account));
    }

    public async getDefaultAccount(): Promise<AccountResponse> {
        const accounts = await this.accountsRepository.findAll();

        if (accounts.length === 0) {
            throw new NoAccountsRegisteredException("This node doesn't have any registered accounts");
        }

        let defaultAccount = accounts.find(account => account.default);

        if (!defaultAccount) {
            defaultAccount = accounts[0];
            defaultAccount.default = true;
            defaultAccount = await this.accountsRepository.save(defaultAccount);
        }

        return accountToAccountResponse(defaultAccount);
    }

    public async getCurrentAccount(user: User): Promise<CurrentAccountResponse> {
        const ethereumAccount = (await this.accountsRepository.findByUserId(user._id))[0];

        return {
            lambdaAddress: user.lambdaWallet,
            ethereumAddress: ethereumAccount.address
        };
    }

    public async getBalanceOfCurrentAccount(user: User): Promise<BalanceResponse> {
        return (await this.serviceNodeClient.getBalanceOfLambdaWallet(user.lambdaWallet)).data;
    }

    public async withdrawFunds(withdrawFundsRequest: WithdrawFundsRequest, user: User): Promise<void> {
        const ethereumAccount = (await this.accountsRepository.findByUserId(user._id))[0];

        const {balance} = (await this.serviceNodeClient.getBalanceOfLambdaWallet(user.lambdaWallet)).data;

        if (withdrawFundsRequest.amount > balance) {
            throw new HttpException(
                `Request was made to withdraw ${withdrawFundsRequest.amount}, but account's balance is ${balance}`,
                HttpStatus.PAYMENT_REQUIRED
            );
        }

        try {
            await this.serviceNodeClient.withdrawFunds({
                ethereumAddress: ethereumAccount.address,
                amount: withdrawFundsRequest.amount
            });
        } catch (error) {
            console.log(error);

            if (error.response) {
                this.log.error(`Could not withdraw funds, Service Node responded with ${error.response.status} status`);
                throw new HttpException(
                    `Could not withdraw funds, Service Node responded with ${error.response.status} status`,
                    HttpStatus.INTERNAL_SERVER_ERROR
                );
            } else {
                this.log.error("Could not withdraw funds, Service Node is unreachable");
                throw new HttpException(
                    "Could not withdraw funds, Service Node is unreachable",
                    HttpStatus.SERVICE_UNAVAILABLE
                );
            }
        }
    }

    public async getLambdaTransactions(user: User): Promise<LambdaTransactionResponse[]> {
        const lambdaTransactions = (await this.serviceNodeClient.getTransactionsOfLambdaWallet(user.lambdaWallet)).data;

        return lambdaTransactions
            .filter(lambdaTransaction => {
                const transactionSender = lambdaTransaction.tx.value.msg.map(message => message.value.from_address)[0];
                const transactionReceiver = lambdaTransaction.tx.value.msg.map(message => message.value.to_address)[0];

                return (transactionSender === user.lambdaWallet && transactionReceiver === config.SYSTEM_LAMBDA_WALLET)
                    || (transactionSender === config.SYSTEM_LAMBDA_WALLET && transactionReceiver === user.lambdaWallet)
            })
            .map(lambdaTransaction => {
                const transactionSender = lambdaTransaction.tx.value.msg.map(message => message.value.from_address)[0];
                const type = transactionSender === user.lambdaWallet ? LambdaTransactionType.LOCK : LambdaTransactionType.UNLOCK;
                const transactionValue = lambdaTransaction.tx.value.msg.map(message => Number(message.value.amount[0].amount))[0] / (10 ** 6);

                return {
                    hash: lambdaTransaction.txhash,
                    timestamp: lambdaTransaction.timestamp,
                    type,
                    value: transactionValue
                }
            });
    }
}
