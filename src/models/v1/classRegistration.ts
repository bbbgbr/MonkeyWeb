import * as Sequelize from 'sequelize';
import { classModel } from './class';
import { userModel } from './user';

export interface IClassRegistrationModel {
    ID?: number;
    StudentID: number;
    ClassID: number;
}

export type ClassRegistrationInstance = Sequelize.Instance<IClassRegistrationModel> & IClassRegistrationModel;

// tslint:disable:object-literal-sort-keys
export function classRegistrationModel(sequalize: Sequelize.Sequelize) {
    const attributes: SequelizeAttributes<IClassRegistrationModel> = {
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
    };

    return sequalize.define<ClassRegistrationInstance, IClassRegistrationModel>('ClassRegistration', attributes, {
        tableName: 'ClassRegistration',
        timestamps: false,
    });
}
