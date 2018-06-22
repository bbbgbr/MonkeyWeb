import * as Sequelize from 'sequelize';
import { commentTextModel } from './commentText';
import { userModel } from './user';

export interface ICommentConfigModel {
    ID?: number;
    UserID: number;
    CommentTextID: number;
}

export type CommentConfigInstance = Sequelize.Instance<ICommentConfigModel> & ICommentConfigModel;

// tslint:disable:object-literal-sort-keys
export function commentConfigModel(sequalize: Sequelize.Sequelize) {
    const attributes: SequelizeAttributes<ICommentConfigModel> = {
        ID: {
            type: Sequelize.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
        UserID: {
            type: Sequelize.NUMBER,
            allowNull: false,
            references: {
                model: userModel(sequalize),
                key: 'ID',
            },
        },
        CommentTextID: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: commentTextModel(sequalize),
                key: 'ID',
            },
        },
    };

    return sequalize.define<CommentConfigInstance, ICommentConfigModel>('CommentConfig', attributes, {
        tableName: 'CommentConfig',
        timestamps: false,
    });
}
