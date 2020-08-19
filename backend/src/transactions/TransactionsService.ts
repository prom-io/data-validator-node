import {HttpException, HttpStatus, Injectable} from "@nestjs/common";
import {LoggerService} from "nest-logger";
import {ServiceNodeTransactionResponse, TransactionResponse, TransactionType} from "./types/response";
import {DataOwnerResponse} from "../accounts/types/response";
import {DataOwnersService} from "../accounts/DataOwnersService";
import {FilesService} from "../files/FilesService";
import {ServiceNodeApiClient} from "../service-node-api";

@Injectable()
export class TransactionsService {
    constructor(private readonly dataOwnersService: DataOwnersService,
                private readonly filesService: FilesService,
                private readonly serviceNodeApiClient: ServiceNodeApiClient,
                private readonly log: LoggerService) {
    }

    // tslint:disable-next-line:max-line-length
    public async getTransactionsByAddressAndType(address: string, type: TransactionType, page: number, pageSize: number): Promise<TransactionResponse[]> {
        return new Promise<TransactionResponse[]>(async (resolve, reject) => {
            try {
                const transactions: ServiceNodeTransactionResponse[] = (await this.serviceNodeApiClient.getTransactionsOfAddressByType(
                    address,
                    type,
                    page,
                    pageSize
                )).data;
                resolve(this.mapTransactionsAndDataOwners(transactions));
            } catch (error) {
                let errorMessage: string;
                if (error.response) {
                    errorMessage = `Error occurred when tried to fetch transactions, Service node responded with ${error.response.status} status`;
                } else {
                    errorMessage = "Unexpected error occurred";
                }

                this.log.error(errorMessage);
                console.log(error);

                reject(new HttpException(errorMessage, HttpStatus.INTERNAL_SERVER_ERROR));
            }
        })
    }

    public async getTransactionsByAddress(address: string, page: number, size: number): Promise<TransactionResponse[]> {
        return new Promise<TransactionResponse[]>(async resolve => {
            const transactions: ServiceNodeTransactionResponse[] = (await this.serviceNodeApiClient.getTransactionsOfAddress(
                address,
                page,
                size
            )).data;

            resolve(this.mapTransactionsAndDataOwners(transactions));
        })
    }

    private async mapTransactionsAndDataOwners(transactions: ServiceNodeTransactionResponse[]): Promise<TransactionResponse[]> {
        const result: TransactionResponse[] = [];

        for (const transaction of transactions) {
            if (await this.dataOwnersService.existsByAddress(transaction.dataOwner)) {
                const dataOwner: DataOwnerResponse = await this.dataOwnersService.findByAddress(transaction.dataOwner);
                result.push({
                    file: dataOwner.file,
                    hash: transaction.hash,
                    sum: transaction.value,
                    createdAt: transaction.created_at,
                    dataOwner,
                    dataMart: transaction.dataMart,
                    type: transaction.type,
                    serviceNode: transaction.serviceNode
                })
            } else {
                this.log.info(`Data owner ${transaction.dataOwner} is not present in local database`);
            }
        }

        return result;
    }
}
