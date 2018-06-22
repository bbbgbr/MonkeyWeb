import { Request, Response } from 'express';
import { RequestHandlerParams } from 'express-serve-static-core';
import * as jwt from 'jwt-simple';
import * as passport from 'passport';
import { ExtractJwt, Strategy as JwtStrategy } from 'passport-jwt';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { IUserModel } from './models/v1/user';
import { User } from './repositories/v1/User';

interface IPayload {
    userID: any;
    expire: string;
}

interface IToken {
    token: string;
    refreshToken: string;
}

interface ITokenResponse {
    token: string;
    expire: Date;
}

const opts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    passReqToCallback: true,
    secretOrKey: process.env.JWT_SECRET,
};

class Auth {

    public static refreshTokens: any = {};

    public static initialize(): RequestHandlerParams {
        passport.use(
            new JwtStrategy(opts, (req: Request, payload: IPayload, done: any) => {
                const expire = new Date(payload.expire);
                const today = new Date();
                if (expire > today) {
                    User.getInstance()
                        .getUserInfo(payload.userID)
                        .subscribe(
                            (user) => {
                                if (user) {
                                    req.user = user;
                                }
                                done(null, user || false);
                            },
                            (error) => done(error, false),
                    );
                } else {
                    done(null, false);
                }
            }),
        );
        return passport.initialize();
    }

    public static session() {
        return passport.session();
    }

    public static authenticate() {
        return passport.authenticate('jwt', { session: false });
    }

    public static generateToken(payload: IPayload): IToken {
        const refreshExpire = new Date();
        refreshExpire.setDate(refreshExpire.getDate() + 365);
        const refreshToken = jwt.encode(
            { userID: payload.userID, expire: refreshExpire },
            process.env.JWT_SECRET,
        );
        const response = {
            refreshToken,
            token: jwt.encode(payload, process.env.JWT_SECRET),
        };
        this.refreshTokens[refreshToken] = response.token;
        return response;
    }

    public static refresh(token: string): null | ITokenResponse {
        const refreshToken: IPayload = jwt.decode(token, process.env.JWT_SECRET);
        if (new Date(refreshToken.expire) > new Date()) {
            const expire = new Date();
            expire.setDate(expire.getDate() + 7);
            const payload: IPayload = {
                expire: expire.toString(),
                userID: refreshToken.userID,
            };
            const newToken = jwt.encode(payload, process.env.JWT_SECRET);
            this.refreshTokens[token] = newToken;
            return { token: newToken, expire };
        } else {
            return null;
        }
    }

    public static login(userID: number, password: string): Observable<IToken> {
        return User.getInstance()
            .login(userID, password)
            .pipe(
                map((user) => {
                    if (user) {
                        const expire = new Date();
                        expire.setDate(expire.getDate() + 7);
                        // tslint:disable:object-literal-sort-keys
                        const payload = {
                            userID,
                            expire: expire.toString(),
                        };
                        const {
                            Position,
                            Nickname,
                            NicknameEn,
                            Firstname,
                            FirstnameEn,
                            Lastname,
                            LastnameEn,
                            ID,
                            SubPosition,
                            Email,
                            Phone,
                        } = user;
                        return {
                            ...Auth.generateToken(payload),
                            Position,
                            Nickname,
                            NicknameEn,
                            Firstname,
                            FirstnameEn,
                            Lastname,
                            LastnameEn,
                            ID,
                            SubPosition,
                            Email,
                            Phone,
                            expire,
                        };
                    } else {
                        throw new Error('Failed to login');
                    }
                }),
        );
    }
}

export default Auth;
