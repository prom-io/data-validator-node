import {Injectable} from "@nestjs/common";
import {JwtService} from "@nestjs/jwt";
import {UsersRepository} from "../accounts/UsersRepository";
import {BCryptPasswordEncoder} from "../bcrypt";
import {User} from "../accounts/types/entity";
import {JwtPayload} from "./types";
import {AccessTokenResponse} from "./types/response";

@Injectable()
export class AuthService {
    constructor(private readonly usersRepository: UsersRepository,
                private readonly passwordEncoder: BCryptPasswordEncoder,
                private readonly jwtService: JwtService) {
    }

    public async validate(username: string, password: string): Promise<User | null> {
        const user = await this.usersRepository.findByLambdaAddress(username);

        if (!user) {
            return null;
        }

        if (await this.passwordEncoder.matches(password, user.passwordHash)) {
            return user;
        }

        return null;
    }

    public async login(user: User): Promise<AccessTokenResponse> {
        const payload: JwtPayload = {
            id: user._id,
            lambdaAddress: user.lambdaWallet
        };

        return {
            accessToken: await this.jwtService.signAsync(payload)
        }
    }
}
