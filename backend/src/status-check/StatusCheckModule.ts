import {Module} from "@nestjs/common";
import {StatusCheckController} from "./StatusCheckController";
import {AccountsModule} from "../accounts";

@Module({
    controllers: [StatusCheckController],
    imports: [AccountsModule]
})
export class StatusCheckModule {}
