import * as Sequelize from 'sequelize';
import { quarterModel } from './quarter';
import { roomModel } from './room';
import { userModel } from './user';

export interface IClassList {
    ID?: number;
    ClassName: string;
    ClassDate: Date;
    Grade?: string;
}

export interface IClassInfo extends IClassList {
    ClassDescription?: string;
    TutorID?: number;
    RoomID?: number;
    ClassTimes?: number;
    ClassType?: string;
}

export interface IClassModel extends IClassInfo {
    QuarterID: number;
    ClassSubject: string;
    Suggestion?: string;
}

export type ClassInstance = Sequelize.Instance<IClassModel> & IClassModel;

// tslint:disable:object-literal-sort-keys
export function classModel(sequalize: Sequelize.Sequelize) {
    const attributes: SequelizeAttributes<IClassModel> = {
        ID: {
            type: Sequelize.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
        ClassName: {
            type: Sequelize.STRING(64),
            allowNull: false,
        },
        QuarterID: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: quarterModel(sequalize),
                key: 'ID',
            },
        },
        ClassDate: {
            type: Sequelize.DATE,
            allowNull: false,
        },
        ClassSubject: {
            type: Sequelize.STRING(8),
            allowNull: false,
        },
        Grade: {
            type: Sequelize.STRING(64),
            allowNull: true,
        },
        TutorID: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
                model: userModel(sequalize),
                key: 'ID',
            },
        },
        RoomID: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
                model: roomModel(sequalize),
                key: 'ID',
            },
        },
        ClassDescription: {
            type: Sequelize.STRING,
            allowNull: true,
        },
        Suggestion: {
            type: Sequelize.STRING(64),
            allowNull: true,
        },
        ClassTimes: {
            type: Sequelize.TINYINT,
            allowNull: true,
        },
        ClassType: {
            type: Sequelize.STRING(16),
            allowNull: true,
        },
    };

    return sequalize.define<ClassInstance, IClassModel>('Class', attributes, {
        tableName: 'Class',
        timestamps: false,
    });
}
