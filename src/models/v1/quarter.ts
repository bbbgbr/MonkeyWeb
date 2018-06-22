import * as Sequelize from 'sequelize';

export interface IQuarterModel {
    ID?: number;
    QuarterName: string;
    Type: string;
    StartDate?: Date;
    EndDate?: Date;
}

export type QuarterInstance = Sequelize.Instance<IQuarterModel> & IQuarterModel;

// tslint:disable:object-literal-sort-keys
export function quarterModel(sequalize: Sequelize.Sequelize) {
    const attributes: SequelizeAttributes<IQuarterModel> = {
        ID: {
            type: Sequelize.INTEGER,
            allowNull: false,
            primaryKey: true,
        },
        QuarterName: {
            type: Sequelize.STRING(32),
            allowNull: false,
        },
        Type: {
            type: Sequelize.STRING(32),
            allowNull: false,
        },
        StartDate: {
            type: Sequelize.DATE,
            allowNull: true,
        },
        EndDate: {
            type: Sequelize.DATE,
            allowNull: true,
        },
    };
    return sequalize.define<QuarterInstance, IQuarterModel>('Quarter', attributes, {
        tableName: 'Quarter',
        timestamps: false,
    });
}
