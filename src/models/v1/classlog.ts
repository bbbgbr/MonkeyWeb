import * as Sequelize from 'sequelize';
import { classModel } from './class';
import { userModel } from './user';

export interface IClassLogModel {
    ID?: number;
    StudentID: number;
    ClassID: number;
    StudyDate: Date;
    CheckInTime?: Date;
    CheckOutTime?: Date;
    HybridSheetID: number;
    TutorID: number;
    Progress?: string;
}

export type ClassLogInstance = Sequelize.Instance<IClassLogModel> & IClassLogModel;

// tslint:disable:object-literal-sort-keys
export function classLogModel(sequalize: Sequelize.Sequelize) {
    const attributes: SequelizeAttributes<IClassLogModel> = {
        ID: {
            type: Sequelize.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
        StudentID: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: userModel(sequalize),
                key: 'ID',
            },
        },
        ClassID: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: classModel(sequalize),
                key: 'ID',
            },
        },
        StudyDate: {
            type: Sequelize.DATEONLY,
            allowNull: false,
        },
        CheckInTime: {
            type: Sequelize.DATE,
            allowNull: true,
        },
        CheckOutTime: {
            type: Sequelize.DATE,
            allowNull: true,
        },
        HybridSheetID: {
            type: Sequelize.INTEGER,
            allowNull: false,
        },
        TutorID: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: userModel(sequalize),
                key: 'ID',
            },
        },
        Progress: {
            type: Sequelize.STRING(16),
            allowNull: true,
        },
    };

    return sequalize.define<ClassLogInstance, IClassLogModel>('ClassLog', attributes, {
        tableName: 'ClassLog',
        timestamps: false,
    });
}
