import * as Sequelize from 'sequelize';
import { tutorLogIntervalModel } from './tutorLogInterval';
import { userModel } from './user';

export interface ITutorLogExtraModel {
    ID?: number;
    UserID: number;
    TutorLogIntervalID: number;
    Note?: string;
    ExtraValue: number;
}

export type TutorLogExtraInstance = Sequelize.Instance<ITutorLogExtraModel> & ITutorLogExtraModel;

// tslint:disable:object-literal-sort-keys
export function tutorLogExtraModel(sequalize: Sequelize.Sequelize) {
    const attributes: SequelizeAttributes<ITutorLogExtraModel> = {
        ID: {
            type: Sequelize.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
        UserID: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: userModel(sequalize),
                key: 'ID',
            },
        },
        TutorLogIntervalID: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: tutorLogIntervalModel(sequalize),
                key: 'ID',
            },
        },
        Note: {
            type: Sequelize.STRING,
            allowNull: true,
        },
        ExtraValue: {
            type: Sequelize.INTEGER,
            allowNull: false,
        },
    };

    return sequalize.define<TutorLogExtraInstance, ITutorLogExtraModel>('TutorLogExtra', attributes, {
        tableName: 'TutorLogExtra',
        timestamps: false,
    });
}
