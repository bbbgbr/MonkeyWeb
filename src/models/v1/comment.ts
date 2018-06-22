import * as Sequelize from 'sequelize';
import { commentTextModel } from './commentText';
import { quarterModel } from './quarter';
import { userModel } from './user';

export interface ICommentModel {
    ID?: number;
    StudentID: number;
    CommentTimestamp?: Date;
    CommentTextID?: number;
    ImagePath?: string;
    QuarterID: number;
    SenderID: number;
    Remark?: string;
    CommentType: string;
}

export type CommentInstance = Sequelize.Instance<ICommentModel> & ICommentModel;

// tslint:disable:object-literal-sort-keys
export function commentModel(sequalize: Sequelize.Sequelize) {
    const attributes: SequelizeAttributes<ICommentModel> = {
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
        CommentTimestamp: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: new Date(),
        },
        CommentTextID: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
                model: commentTextModel(sequalize),
                key: 'ID',
            },
        },
        ImagePath: {
            type: Sequelize.STRING,
            allowNull: true,
        },
        QuarterID: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: quarterModel(sequalize),
                key: 'ID',
            },
        },
        SenderID: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: userModel(sequalize),
                key: 'ID',
            },
        },
        Remark: {
            type: Sequelize.STRING(2),
            allowNull: true,
        },
        CommentType: {
            type: Sequelize.STRING(30),
            allowNull: false,
        },
    };

    return sequalize.define<CommentInstance, ICommentModel>('Comment', attributes, {
        tableName: 'Comment',
        timestamps: false,
    });
}
