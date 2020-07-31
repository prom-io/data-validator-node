import {IBaseEntity} from "../../../nedb/entity";

export interface User extends IBaseEntity {
    passwordHash: string,
    lambdaWallet: string
}
