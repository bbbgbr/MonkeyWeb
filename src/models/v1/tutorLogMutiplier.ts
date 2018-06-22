import * as Sequelize from 'sequelize';
import { tutorLogIntervalModel } from './tutorLogInterval';
import { userModel } from './user';

export interface ITutorLogMulitplierModel {
    ID?: number;
    UserID: number;
    TutorLogIntervalID: number;
    Multiplier: number;
}

export type TutorLogMultiplierInstance = Sequelize.Instance<ITutorLogMulitplierModel> & ITutorLogMulitplierModel;

// tslint:disable:object-literal-sort-keys
export function tutorLogMulitplierModel(sequalize: Sequelize.Sequelize) {
    const attributes: SequelizeAttributes<ITutorLogMulitplierModel> = {
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
        Multiplier: {
            type: Sequelize.INTEGER,
            allowNull: false,
        },
    };

    return sequalize.define<TutorLogMultiplierInstance, ITutorLogMulitplierModel>('TutorLogMultiplier', attributes, {
        tableName: 'TutorLogMultiplier',
        timestamps: false,
    });
}
