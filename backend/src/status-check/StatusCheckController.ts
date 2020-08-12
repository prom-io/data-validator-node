import {Controller, Get} from "@nestjs/common";
import {AccountsRepository} from "../accounts/AccountsRepository";

@Controller("api/v1/status")
export class StatusCheckController {
    constructor(private readonly accountsRepository: AccountsRepository) {
    }

    @Get()
    public async getStatus(): Promise<{status: string, walletAddresses: string[]}> {
        const walletAddresses = (await this.accountsRepository.findAll()).map(account => account.address);
        return {
            status: "UP",
            walletAddresses
        };
    }
}
