import {HttpException, HttpStatus, Injectable} from "@nestjs/common";
import uuid from "uuid/v4";
import {AccountsRepository} from "./AccountsRepository";
import {accountToAccountResponse} from "./account-mappers";
import {AccountType} from "./types";
import {AccountResponse, BalanceResponse, BalancesResponse, DataOwnersOfDataValidatorResponse} from "./types/response";
import {CreateDataValidatorRequest, ICreateDataOwnerRequest} from "./types/request";
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

@Injectable()
export class AccountsService {
    constructor(private readonly accountsRepository: AccountsRepository,
                private readonly usersRepository: UsersRepository,
                private readonly serviceNodeClient: ServiceNodeApiClient,
                private readonly walletGeneratorApiClient: WalletGeneratorApiClient,
                private readonly passwordEncoder: BCryptPasswordEncoder,
                private readonly web3Wrapper: Web3Wrapper) {
    }

    public async createDataValidatorAccount(createDataValidatorAccountRequest: CreateDataValidatorRequest): Promise<void> {

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

            await this.accountsRepository.save({
                address: createDataValidatorAccountRequest.address,
                privateKey: createDataValidatorAccountRequest.privateKey,
                _type: EntityType.ACCOUNT,
                default: defaultAccount,
                userId
            });
        } catch (error) {
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
}
