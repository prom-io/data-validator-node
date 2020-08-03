import {IsArray, IsNotEmpty, IsString} from "class-validator";
import {Transform} from "class-transformer";

export class FilePriceAndKeepUntilMapRequest {
    @IsArray()
    @IsNotEmpty()
    @IsString({each: true})
    @Transform((value: string) => {
        try {
            return JSON.parse(value);
        } catch (error) {
            return [];
        }
    })
    public filesIds: string[];
}
