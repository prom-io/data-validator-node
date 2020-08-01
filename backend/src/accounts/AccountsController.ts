import {Body, Controller, Get, Param, Post, Req, UseGuards} from "@nestjs/common";
import {AuthGuard} from "@nestjs/passport";
import {Request} from "express";
import {AccountsService} from "./AccountsService";
import {DataOwnersService} from "./DataOwnersService";
import {CreateDataValidatorRequest, WithdrawFundsRequest} from "./types/request";
import {AccountResponse, BalanceResponse, BalancesResponse, DataOwnersOfDataValidatorResponse} from "./types/response";
import {CurrentAccountResponse} from "./types/response/CurrentAccountResponse";
import {User} from "./types/entity";

@Controller("api/v3/accounts")
export class AccountsController {
    constructor(private readonly accountsService: AccountsService,
                private readonly dataOwnersService: DataOwnersService) {}

    @Get()
    public getAllAccounts(): Promise<AccountResponse[]> {
        return this.accountsService.getAllAccounts();
    }

    @UseGuards(AuthGuard("jwt"))
    @Get("current")
    public getCurrentAccount(@Req() request: Request): Promise<CurrentAccountResponse> {
        return this.accountsService.getCurrentAccount((request as any).user as User);
    }

    @UseGuards(AuthGuard("jwt"))
    @Get("current/balance")
    public getBalanceOfCurrentAccount(@Req() request: Request): Promise<BalanceResponse> {
        return this.accountsService.getBalanceOfCurrentAccount((request as any).user as User);
    }

    @Post()
    public createDataValidator(@Body() createDataValidatorRequest: CreateDataValidatorRequest): Promise<void> {
        return this.accountsService.createDataValidatorAccount(createDataValidatorRequest);
    }

    @Get("data-validators/:address/data-owners")
    public getDataOwnersOfDataValidator(@Param("address") address: string): Promise<DataOwnersOfDataValidatorResponse> {
        return new Promise<DataOwnersOfDataValidatorResponse>(resolve => this.dataOwnersService.findAllDataOwnersByDataValidator(address)
            .then(dataOwners => resolve({dataOwners}))
        );
    }

    @Get(":address/balance")
    public getBalanceOfAccount(@Param("address") address: string): Promise<BalanceResponse> {
        return this.accountsService.getBalanceOfAccount(address);
    }

    @Get("balances")
    public getBalancesOfAllAccounts(): Promise<BalancesResponse> {
        return this.accountsService.getBalancesOfAllAccounts();
    }

    @UseGuards(AuthGuard("jwt"))
    @Post("withdraw")
    public withdrawFunds(@Body() withdrawFundsRequest: WithdrawFundsRequest,
                         @Req() request: Request): Promise<void> {
        return this.accountsService.withdrawFunds(withdrawFundsRequest, (request as any).user as User);
    }
}
