import {IsNotEmpty, IsNumber, IsPositive} from "class-validator";

export class WithdrawFundsRequest {
    @IsNotEmpty()
    @IsNumber()
    @IsPositive()
    amount: number;
}
