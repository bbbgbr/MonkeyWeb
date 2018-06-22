import * as Sequelize from 'sequelize';

export enum UserStatus {
    active = 'active',
    dropped = 'dropped',
    inactive = 'inactive',
    terminated = 'terminated',
}

export enum UserPosition {
    student = 'student',
    tutor = 'tutor',
    admin = 'admin',
    dev = 'dev',
    mel = 'mel',
}

export interface IUserID {
    ID?: number;
}

export interface IUserNicknameEn extends IUserID {
    NicknameEn?: string;
}

export interface IUserNameEn extends IUserID {
    FirstnameEn?: string;
    LastnameEn?: string;
}

export interface IUserFullNameEn extends IUserNicknameEn, IUserNameEn { }

export interface IUserNicknameTh extends IUserID {
    Nickname?: string;
}

export interface IUserNameTh extends IUserID {
    Firstname?: string;
    Lastname?: string;
}

export interface IUserFullNameTh extends IUserNicknameTh, IUserNameTh { }

export interface IUserName extends IUserFullNameEn, IUserFullNameTh { }

export interface IUserInfo extends IUserName {
    Email?: string;
    Phone?: string;
    UserStatus: UserStatus;
    Position: UserPosition;
    SubPosition?: string;
}

export interface IUserModel extends IUserInfo {
    UserPassword?: string;
}

export type UserInstance = Sequelize.Instance<IUserModel> & IUserModel;

// tslint:disable:object-literal-sort-keys
export function userModel(sequalize: Sequelize.Sequelize) {
    const attributes: SequelizeAttributes<IUserModel> = {
        ID: {
            type: Sequelize.INTEGER,
            allowNull: false,
            primaryKey: true,
        },
        Firstname: {
            type: Sequelize.STRING(64),
            allowNull: true,
        },
        Lastname: {
            type: Sequelize.STRING(64),
            allowNull: true,
        },
        Nickname: {
            type: Sequelize.STRING(64),
            allowNull: true,
        },
        FirstnameEn: {
            type: Sequelize.STRING(64),
            allowNull: true,
        },
        LastnameEn: {
            type: Sequelize.STRING(64),
            allowNull: true,
        },
        NicknameEn: {
            type: Sequelize.STRING(64),
            allowNull: true,
        },
        Email: {
            type: Sequelize.STRING(64),
            allowNull: true,
        },
        Phone: {
            type: Sequelize.STRING(16),
            allowNull: true,
        },
        UserStatus: {
            type: Sequelize.STRING(32),
            allowNull: false,
        },
        Position: {
            type: Sequelize.STRING(32),
            allowNull: false,
        },
        UserPassword: {
            type: Sequelize.STRING(128),
            allowNull: true,
        },
    };
    return sequalize.define<UserInstance, IUserModel>('Users', attributes, {
        timestamps: false,
    });
}
