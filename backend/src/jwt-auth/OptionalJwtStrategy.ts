import {Injectable, UnauthorizedException} from "@nestjs/common";
import {PassportStrategy} from "@nestjs/passport";
import {ExtractJwt, Strategy} from "passport-jwt";
import {config} from "../config";
import {UsersRepository} from "../accounts/UsersRepository";
import {JwtPayload} from "./types";
import {User} from "../accounts/types/entity";

@Injectable()
export class OptionalJwtStrategy extends PassportStrategy(Strategy, "optionalJwt") {

    constructor(private readonly usersRepository: UsersRepository) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: config.JWT_SECRET,
        });
    }

    public async validate(payload?: JwtPayload): Promise<User | null> {
        if (!payload) {
            return null;
        }

        try {
            return await this.usersRepository.findByLambdaAddress(payload.lambdaAddress);
        } catch (error) {
            throw new UnauthorizedException();
        }
    }
}
