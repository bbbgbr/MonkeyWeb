import * as Sequelize from 'sequelize';
import { sheetModel } from './sheet';
import { userModel } from './user';

export interface IPortfolioModel {
    ID?: number;
    StudentID: number;
    HybridSheetID: number;
    StartDate?: Date;
    EndDate?: Date;
    Score?: string;
}

export type PortfolioInstance = Sequelize.Instance<IPortfolioModel> & IPortfolioModel;

// tslint:disable:object-literal-sort-keys
export function portfolioModel(sequalize: Sequelize.Sequelize) {
    const attributes: SequelizeAttributes<IPortfolioModel> = {
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
        HybridSheetID: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: sheetModel(sequalize),
                key: 'ID',
            },
        },
        StartDate: {
            type: Sequelize.DATEONLY,
            allowNull: true,
        },
        EndDate: {
            type: Sequelize.DATEONLY,
            allowNull: true,
        },
        Score: {
            type: Sequelize.STRING,
            allowNull: true,
        },
    };

    return sequalize.define<PortfolioInstance, IPortfolioModel>('Portfolio', attributes, {
        tableName: 'Portfolio',
        timestamps: false,
    });
}
