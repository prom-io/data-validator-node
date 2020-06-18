import {Module} from "@nestjs/common";
import {DefaultAccountRepository} from "./DefaultAccountRepository";
import {DefaultAccountProviderService} from "./DefaultAccountProviderService";

@Module({
    providers: [DefaultAccountProviderService, DefaultAccountRepository],
    exports: [DefaultAccountProviderService],
})
export class DefaultAccountProviderModule {}
