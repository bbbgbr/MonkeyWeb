import * as Sequelize from 'sequelize';
import { quarterModel } from './quarter';
import { userModel } from './user';

export enum UserRegistrationStage {
    pending = 'pending',
    untransferred = 'untransferred',
    finished = 'finished',
    approved = 'approved',
    rejected = 'rejected',
    unregistered = 'unregistered',
    registered = 'registered',
}

export interface IGradeStudentState {
    Grade: number;
}

export interface IAllStudentState extends IGradeStudentState {
    StudentLevel?: string;
    Stage: UserRegistrationStage;
    Remark?: string;
}

export interface IStudentStateModel extends IAllStudentState {
    ID?: number;
    QuarterID: number;
    StudentID: number;
}

export type StudentStateInstance = Sequelize.Instance<IStudentStateModel> & IStudentStateModel;

// tslint:disable:object-literal-sort-keys
export function studentStateModel(sequalize: Sequelize.Sequelize) {
    const attributes: SequelizeAttributes<IStudentStateModel> = {
        ID: {
            type: Sequelize.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
        Grade: {
            type: Sequelize.TINYINT,
            allowNull: false,
        },
        StudentLevel: {
            type: Sequelize.STRING(32),
            allowNull: true,
        },
        QuarterID: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: quarterModel(sequalize),
                key: 'ID',
            },
        },
        StudentID: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: userModel(sequalize),
                key: 'ID',
            },
        },
        Stage: {
            type: Sequelize.STRING(32),
            allowNull: false,
        },
        Remark: {
            type: Sequelize.STRING(32),
            allowNull: false,
        },
    };

    return sequalize.define<StudentStateInstance, IStudentStateModel>('StudentState', attributes, {
        tableName: 'StudentState',
        timestamps: false,
    });
}
