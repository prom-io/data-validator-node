import {Module} from "@nestjs/common";
import {LoggerModule} from "./logging";
import {NedbModule} from "./nedb";
import {FilesModule} from "./files";
import {AccountsModule} from "./accounts/AccountsModule";
import {TransactionsModule} from "./transactions";
import {DiscoveryModule} from "./discovery";
import {Web3Module} from "./web3";
import {EncryptorServiceModule} from "./encryptor";
import {StatusCheckModule} from "./status-check";
import {DefaultAccountProviderModule} from "./default-account-provider/DefaultAccountProviderModule";
import {BCryptModule} from "./bcrypt";
import {WalletGeneratorModule} from "./wallet-generator";
import {AuthModule} from "./jwt-auth";

@Module({
    imports: [
        LoggerModule,
        NedbModule,
        FilesModule,
        AccountsModule,
        DefaultAccountProviderModule,
        TransactionsModule,
        DiscoveryModule,
        Web3Module,
        EncryptorServiceModule,
        StatusCheckModule,
        BCryptModule,
        WalletGeneratorModule,
        AuthModule
    ]
})
export class AppModule {}
