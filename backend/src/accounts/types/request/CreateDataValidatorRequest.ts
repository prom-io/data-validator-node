import {IsString, IsNotEmpty, Matches, ValidateIf} from "class-validator";
import {IsValidEthereumPrivateKey} from "../../../utils/validation";

export class CreateDataValidatorRequest {
    @ValidateIf((object: CreateDataValidatorRequest) => Boolean(object.address))
    @IsString({message: "Address must be string"})
    @IsNotEmpty({message: "Address must not be empty"})
    /*@Matches(
        new RegExp("^0x[a-fA-F0-9]{40}$"),
        {
            message: "Address must be valid Ethereum address"
        }
    )*/
    public address?: string;

    @ValidateIf((object: CreateDataValidatorRequest) => Boolean(object.address))
    @IsString({message: "Private key must be string"})
    @IsNotEmpty({message: "Private key must not be empty"})
    // @IsValidEthereumPrivateKey("address")
    public privateKey?: string;

    @ValidateIf((object: CreateDataValidatorRequest) => object.lambdaWallet && object.lambdaWallet.trim().length !== 0)
    @IsString()
    public lambdaWallet?: string;

    @ValidateIf((object: CreateDataValidatorRequest) => Boolean(object.lambdaWallet))
    @IsString()
    public password?: string;

    @ValidateIf((object: CreateDataValidatorRequest) => Boolean(object.lambdaWallet))
    @IsString()
    public passwordConfirmation?: string;

    constructor(address?: string, privateKey?: string, lambdaWallet?: string, password?: string, passwordConfirmation?: string) {
        this.address = address;
        this.privateKey = privateKey;
        this.lambdaWallet = lambdaWallet;
        this.password = password;
        this.passwordConfirmation = passwordConfirmation;
    }
}
