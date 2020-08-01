import {forwardRef, Module} from "@nestjs/common";
import {AccountsController} from "./AccountsController";
import {AccountsService} from "./AccountsService";
import {AccountsRepository} from "./AccountsRepository";
import {DataOwnersService} from "./DataOwnersService";
import {DataOwnersRepository} from "./DataOwnersRepository";
import {InitialAccountRegistrationHandler} from "./InitialAccountRegistrationHandler";
import {ServiceNodeApiClientModule} from "../service-node-api";
import {Web3Module} from "../web3";
import {UsersRepository} from "./UsersRepository";
import {WalletGeneratorApiClient} from "../wallet-generator/WalletGeneratorApiClient";
import {WalletGeneratorModule} from "../wallet-generator";
import {AuthModule} from "../jwt-auth";

@Module({
    controllers: [AccountsController],
    providers: [
        AccountsService,
        AccountsRepository,
        DataOwnersService,
        DataOwnersRepository,
        InitialAccountRegistrationHandler,
        UsersRepository
    ],
    imports: [
        ServiceNodeApiClientModule,
        Web3Module,
        WalletGeneratorModule,
        forwardRef(() => AuthModule)
    ],
    exports: [DataOwnersService, DataOwnersRepository, AccountsRepository, AccountsService, UsersRepository]
})
export class AccountsModule {}
