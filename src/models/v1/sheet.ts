import * as Sequelize from 'sequelize';
import { topicModel } from './topic';

export interface IHybridSheetModel {
    ID?: number;
    TopicID: number;
    SheetLevel: string;
    SheetNumber: number;
    SubLevel?: string;
    Rev?: number;
    SheetPath: string;
}

export type HybridSheetInstance = Sequelize.Instance<IHybridSheetModel> & IHybridSheetModel;

// tslint:disable:object-literal-sort-keys
export function sheetModel(sequalize: Sequelize.Sequelize) {
    const attributes: SequelizeAttributes<IHybridSheetModel> = {
        ID: {
            type: Sequelize.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
        TopicID: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: topicModel(sequalize),
                key: 'ID',
            },
        },
        SheetLevel: {
            type: Sequelize.CHAR(1),
            allowNull: false,
        },
        SheetNumber: {
            type: Sequelize.NUMERIC(2, 0),
            allowNull: false,
        },
        SubLevel: {
            type: Sequelize.STRING(2),
            allowNull: true,
        },
        Rev: {
            type: Sequelize.NUMERIC(2, 1),
            allowNull: true,
        },
        SheetPath: {
            type: Sequelize.STRING(128),
            allowNull: false,
        },
    };
    return sequalize.define<HybridSheetInstance, IHybridSheetModel>('HybridSheet', attributes, {
        tableName: 'HybridSheet',
        timestamps: false,
    });
}
