import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import * as Sequelize from 'sequelize';
import { Connection } from '../../models/Connection';
import { CommentTextInstance, commentTextModel, ICommentTextModel } from '../../models/v1/commentText';

export class CommentText {

    public static getInstance(): CommentText {
        if (!this.instance) {
            this.instance = new CommentText();
        }
        return this.instance;
    }

    private static instance: CommentText;

    private commentTextModel: Sequelize.Model<CommentTextInstance, ICommentTextModel>;

    private constructor() {
        this.commentTextModel = commentTextModel(Connection.getInstance().getConnection());
    }

    public add(
        Text: string,
    ): Observable<ICommentTextModel> {
        return from(this.commentTextModel.create({ Text }));
    }

    public edit(
        ID: number,
        Text: string,
    ): Observable<number> {
        return from(this.commentTextModel.update({ Text }, { where: { ID } }))
            .pipe(
                map((result) => result[0]),
        );
    }

    public delete(
        ID: number,
    ): Observable<number> {
        return from(this.commentTextModel.destroy({ where: { ID } }));
    }

    public list(
    ): Observable<ICommentTextModel[]> {
        return from(this.commentTextModel.findAll<ICommentTextModel>());
    }
}
