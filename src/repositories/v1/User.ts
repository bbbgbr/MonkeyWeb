import { AES, enc } from 'crypto-js';
import { from, Observable } from 'rxjs';
import { flatMap, map } from 'rxjs/operators';
import * as Sequelize from 'sequelize';
import { Connection } from '../../models/Connection';
import { IChatMessage } from '../../models/v1/chat';
import { IAllStudentState, IStudentStateModel, UserRegistrationStage } from '../../models/v1/studentState';
import { IUserFullNameTh, IUserID, IUserInfo, IUserModel, IUserNicknameEn, UserInstance, userModel, UserPosition, UserStatus } from '../../models/v1/user';
import { StudentState } from './StudentState';

export type AllStudent = IUserFullNameTh & IAllStudentState & IChatMessage;

export class User {
    public static getInstance(): User {
        if (!this.instance) {
            this.instance = new User();
        }
        return this.instance;
    }

    private static instance: User;

    private userModel: Sequelize.Model<UserInstance, IUserModel>;

    private constructor() {
        this.userModel = userModel(Connection.getInstance().getConnection());
    }

    public listTutors(): Observable<IUserNicknameEn[]> {
        return from(
            this.userModel.findAll<IUserNicknameEn>({
                attributes: ['ID', 'NicknameEn'],
                raw: true,
                where: {
                    Position: {
                        [Sequelize.Op.ne]: 'student',
                    },
                    UserStatus: UserStatus.active,
                },
            }),
        );
    }

    public listStudent(
        QuarterID: number,
        options?: {
            Stage?: UserRegistrationStage;
            UserStatus?: UserStatus;
            Grade?: number;
        },
    ): Observable<AllStudent[]> {
        let statement =
            'SELECT Users.ID, Users.Firstname, Users.Nickname, StudentState.Grade, StudentState.StudentLevel, StudentState.Remark, Chat.ChatMessage ' +
            'FROM Users ' +
            '   JOIN StudentState ON StudentState.StudentID = Users.ID ' +
            '   LEFT JOIN Chat ON Chat.StudentID = Users.ID AND Chat.ID = ( ' +
            '       SELECT TOP(1) ID ' +
            '       FROM Chat ' +
            '       WHERE Chat.StudentID = Users.ID ' +
            '       ORDER BY Chat.ChatTimestamp DESC ' +
            '   ) ' +
            'WHERE Users.Position = \'student\' AND StudentState.QuarterID = :QuarterID';
        let replacements: any = { QuarterID };
        if (options && options.Stage) {
            statement += ' AND StudentState.Stage = :Stage';
            replacements = {
                ...replacements,
                Stage: options.Stage,
            };
        }
        if (options && options.UserStatus) {
            statement += ' AND Users.UserStatus = :UserStatus';
            replacements = {
                ...replacements,
                UserStatus: options.UserStatus,
            };
        }
        if (options && options.Grade) {
            statement += ' AND StudentState.Grade = :Grade';
            replacements = {
                ...replacements,
                Grade: options.Grade,
            };
        }
        return Connection.getInstance().query<AllStudent>(statement, {
            raw: true,
            replacements,
            type: Sequelize.QueryTypes.SELECT,
        });
    }

    public getUserInfo(ID: number): Observable<IUserInfo> {
        return from(
            this.userModel.findOne<IUserInfo>({
                attributes: {
                    exclude: ['UserPassword'],
                },
                raw: true,
                where: { ID },
            }),
        );
    }

    public login(
        ID: number,
        UserPassword: string,
    ): Observable<IUserModel | null> {
        return from(
            this.userModel.findOne<IUserModel>({
                attributes: { include: ['ID', 'UserPassword', 'Position'] },
                where: { ID },
            }),
        ).pipe(
            map((user: IUserModel) => {
                if (this.decrypt(user.UserPassword) === UserPassword) {
                    return user;
                } else {
                    return null;
                }
            }),
        );
    }

    public decryptPassword(ID: number): Observable<string> {
        return from(
            this.userModel.findOne<IUserModel>({
                attributes: {
                    include: ['UserPassword'],
                },
                where: { ID },
            }),
        ).pipe(map((result) => this.decrypt(result.UserPassword)));
    }

    public addTutor(
        Firstname: string,
        Lastname: string,
        Nickname: string,
        FirstnameEn: string,
        LastnameEn: string,
        NicknameEn: string,
        Email: string,
        Phone: string,
        password: string,
    ): Observable<number> {
        // tslint:disable:object-literal-sort-keys
        return from(
            this.userModel.create({
                Firstname,
                Lastname,
                Nickname,
                FirstnameEn,
                LastnameEn,
                NicknameEn,
                Email,
                Phone,
                UserPassword: this.encrypt(password),
                UserStatus: UserStatus.active,
                Position: UserPosition.tutor,
            }),
        ).pipe(map((result) => result.ID));
    }

    public addStudent(): Observable<IUserID & { password: string }> {
        const password = this.generatePassword();
        return from(
            this.userModel.create({
                Position: UserPosition.student,
                UserStatus: UserStatus.inactive,
                UserPassword: this.encrypt(password),
            }),
        ).pipe(map((result) => ({ ID: result.ID, password })));
    }

    public registerStudent(
        ID: number,
        Firstname: string,
        Lastname: string,
        Nickname: string,
        FirstnameEn: string,
        LastnameEn: string,
        NicknameEn: string,
        Email: string,
        Phone: string,
        Grade: number,
        QuarterID: number,
    ): Observable<number> {
        return StudentState.getInstance()
            .add(ID, QuarterID, Grade, UserRegistrationStage.unregistered)
            .pipe(
                flatMap(() =>
                    this.edit(ID, {
                        Firstname,
                        Lastname,
                        Nickname,
                        FirstnameEn,
                        LastnameEn,
                        NicknameEn,
                        Email,
                        Phone,
                        UserStatus: UserStatus.active,
                    }),
                ),
        );
    }

    public edit(ID: number, value: Partial<IUserModel>): Observable<number> {
        let updateValue = {} as Partial<IUserModel>;
        if (value.Firstname) {
            updateValue = { ...updateValue, Firstname: value.Firstname };
        }
        if (value.Lastname) {
            updateValue = { ...updateValue, Lastname: value.Lastname };
        }
        if (value.Nickname) {
            updateValue = { ...updateValue, Nickname: value.Nickname };
        }
        if (value.FirstnameEn) {
            updateValue = { ...updateValue, FirstnameEn: value.FirstnameEn };
        }
        if (value.LastnameEn) {
            updateValue = { ...updateValue, LastnameEn: value.LastnameEn };
        }
        if (value.NicknameEn) {
            updateValue = { ...updateValue, NicknameEn: value.NicknameEn };
        }
        if (value.Email) {
            updateValue = { ...updateValue, Email: value.Email };
        }
        if (value.Phone) {
            updateValue = { ...updateValue, Phone: value.Phone };
        }
        if (value.UserPassword) {
            updateValue = {
                ...updateValue,
                UserPassword: this.encrypt(value.UserPassword),
            };
        }
        if (value.UserStatus) {
            updateValue = { ...updateValue, UserStatus: value.UserStatus };
        }
        if (value.Position) {
            updateValue = { ...updateValue, Position: value.Position };
        }
        if (value.SubPosition) {
            updateValue = { ...updateValue, SubPosition: value.SubPosition };
        }
        return from(this.userModel.update(updateValue, { where: { ID } })).pipe(
            map((result) => result[0]),
        );
    }
    public getAllStudent() {
        return from(this.userModel.findAll({ where: { Position: 'student' } }));
    }
    private encrypt(password: string): string {
        return AES.encrypt(password, process.env.PASSWORD_SECRET).toString();
    }

    private decrypt(password: string): string {
        return AES.decrypt(password, process.env.PASSWORD_SECRET).toString(enc.Utf8);
    }

    private generatePassword(): string {
        const randomPassword = '' + Math.random();
        return randomPassword.substr(2, 4);
    }
}
