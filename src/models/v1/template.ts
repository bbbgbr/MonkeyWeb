import * as Sequelize from 'sequelize';

export interface ITemplateModel {
    ID?: number;
}

export type TemplateInstance = Sequelize.Instance<ITemplateModel> & ITemplateModel;

// tslint:disable:object-literal-sort-keys
export function templateModel(sequalize: Sequelize.Sequelize) {
    const attributes: SequelizeAttributes<ITemplateModel> = {
        ID: {
            type: Sequelize.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
    };

    return sequalize.define<TemplateInstance, ITemplateModel>('TemplateTableName', attributes, {
        tableName: 'TemplateTableName',
        timestamps: false,
    });
}
