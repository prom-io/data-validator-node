import {Injectable} from "@nestjs/common";
import DataStore from "nedb";
import {User} from "./types/entity";
import {EntityType} from "../nedb/entity";

@Injectable()
export class UsersRepository {
    constructor(private readonly dataStore: DataStore) {
    }

    public save(user: User): Promise<User> {
        return new Promise<User>(resolve => {
            this.dataStore.findOne<User>({_type: EntityType.USER, _id: user._id}, (_, document) => {
                if (document === null) {
                    this.dataStore.insert(user, (error, saved) => resolve(saved));
                } else {
                    this.dataStore.update(document, user, {}, () => resolve(user));
                }
            })
        })
    };

    public findByLambdaAddress(lambdaAddress: string): Promise<User | null> {
        return new Promise<User | null>(resolve => {
            this.dataStore.findOne<User | null>({_type: EntityType.USER, lambdaAddress}, (_, document) => resolve(document));
        })
    };

    public findById(id: string): Promise<User | null> {
        return new Promise<User | null>(resolve => {
            this.dataStore.findOne<User | null>({_type: EntityType.USER, _id: id}, (_, document) => resolve(document));
        })
    }
}
