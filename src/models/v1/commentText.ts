import * as Sequelize from 'sequelize';

export interface ICommentTextModel {
    ID?: number;
    Text: string;
}

export type CommentTextInstance = Sequelize.Instance<ICommentTextModel> & ICommentTextModel;

// tslint:disable:object-literal-sort-keys
export function commentTextModel(sequalize: Sequelize.Sequelize) {
    const attributes: SequelizeAttributes<ICommentTextModel> = {
        ID: {
            type: Sequelize.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
        Text: {
            type: Sequelize.STRING,
            allowNull: false,
        },
    };

    return sequalize.define<CommentTextInstance, ICommentTextModel>('CommentText', attributes, {
        tableName: 'CommentText',
        timestamps: false,
    });
}
