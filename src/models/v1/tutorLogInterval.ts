import * as Sequelize from 'sequelize';
import { userModel } from './user';

export interface ITutorLogIntervalModel {
    ID?: number;
    IntervalName?: string;
    StartDate: Date;
    EndDate: Date;
    LastEdit: Date;
    EditedBy: number;
}

export type TutorLogIntervalInstance = Sequelize.Instance<ITutorLogIntervalModel> & ITutorLogIntervalModel;

// tslint:disable:object-literal-sort-keys
export function tutorLogIntervalModel(sequalize: Sequelize.Sequelize) {
    const attributes: SequelizeAttributes<ITutorLogIntervalModel> = {
        ID: {
            type: Sequelize.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
        IntervalName: {
            type: Sequelize.STRING(30),
            allowNull: true,
        },
        StartDate: {
            type: Sequelize.DATE,
            allowNull: false,
        },
        EndDate: {
            type: Sequelize.DATE,
            allowNull: false,
        },
        LastEdit: {
            type: Sequelize.DATE,
            allowNull: false,
        },
        EditedBy: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: userModel(sequalize),
                key: 'ID',
            },
        },
    };

    return sequalize.define<TutorLogIntervalInstance, ITutorLogIntervalModel>('TutorLogInterval', attributes, {
        tableName: 'TutorLogInterval',
        timestamps: false,
    });
}
