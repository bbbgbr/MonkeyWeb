import * as Sequelize from 'sequelize';

export interface IChatMessage {
    ChatMessage: string;
}

export interface IChat extends IChatMessage {
    ChatTimestamp?: Date;
}

export interface IChatModel extends IChat {
    ID?: number;
    StudentID: number;
    QuarterID: number;
    SenderID: number;
}

export type ChatInstance = Sequelize.Instance<IChatModel> & IChatModel;

// tslint:disable:object-literal-sort-keys
export function chatModel(sequalize: Sequelize.Sequelize) {
    const attributes: SequelizeAttributes<IChatModel> = {
        ID: {
            type: Sequelize.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
        StudentID: {
            type: Sequelize.INTEGER,
            allowNull: false,
        },
        ChatTimestamp: {
            type: Sequelize.DATE,
            allowNull: true,
        },
        ChatMessage: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        QuarterID: {
            type: Sequelize.INTEGER,
            allowNull: false,
        },
        SenderID: {
            type: Sequelize.INTEGER,
            allowNull: false,
        },
    };

    return sequalize.define<ChatInstance, IChatModel>('Chat', attributes, {
        tableName: 'Chat',
        timestamps: false,
    });
}
