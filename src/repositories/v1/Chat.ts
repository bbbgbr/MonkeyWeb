import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import * as Sequelize from 'sequelize';
import { Connection } from '../../models/Connection';
import { ChatInstance, chatModel, IChat, IChatModel } from '../../models/v1/chat';
import { IUserNicknameEn } from '../../models/v1/user';

export type ChatMessage = IChat & IUserNicknameEn;

export class Chat {

    public static getInstance(): Chat {
        if (!this.instance) {
            this.instance = new Chat();
        }
        return this.instance;
    }

    private static instance: Chat;

    private chatModel: Sequelize.Model<ChatInstance, IChatModel>;

    private constructor() {
        this.chatModel = chatModel(Connection.getInstance().getConnection());
    }

    public add(
        StudentID: number,
        ChatMessage: string,
        QuarterID: number,
        SenderID: number,
    ): Observable<IChatModel> {
        return from(this.chatModel.create({ StudentID, ChatMessage, QuarterID, SenderID }));
    }

    public edit(
        ID: number,
        value: Partial<IChatModel>,
    ): Observable<number> {
        let updateValue = {} as Partial<IChatModel>;
        if (value.ChatMessage) {
            updateValue = { ...updateValue, ChatMessage: value.ChatMessage };
        }
        if (value.SenderID) {
            updateValue = { ...updateValue, SenderID: value.SenderID };
        }
        if (value.StudentID) {
            updateValue = { ...updateValue, StudentID: value.StudentID };
        }
        if (value.QuarterID) {
            updateValue = { ...updateValue, QuarterID: value.QuarterID };
        }
        return from(this.chatModel.update(updateValue, { where: { ID } }))
            .pipe(
                map((result) => result[0]),
        );
    }

    public delete(
        ID: number,
    ): Observable<number> {
        return from(this.chatModel.destroy({ where: { ID } }));
    }

    public list(
        StudentID: number,
        limit?: number,
    ): Observable<ChatMessage[]> {
        let statement = 'SELECT ';
        if (limit) {
            statement += 'TOP(' + limit + ') ';
        }
        statement += 'Chat.ChatMessage, Chat.ChatTimestamp, Users.NicknameEn ' +
            'FROM Chat ' +
            '   JOIN Users ON Users.ID = Chat.SenderID ' +
            'WHERE StudentID = :StudentID ' +
            'ORDER BY Chat.ChatTimestamp DESC';
        return Connection.getInstance().query<ChatMessage>(statement,
            {
                raw: true,
                replacements: { StudentID },
                type: Sequelize.QueryTypes.SELECT,
            },
        );
    }
}
