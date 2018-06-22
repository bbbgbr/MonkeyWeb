import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import * as Sequelize from 'sequelize';
import { Connection } from '../../models/Connection';
import { ClassLogInstance, classLogModel, IClassLogModel } from '../../models/v1/classlog';

export class ClassLog {

    public static getInstance(): ClassLog {
        if (!this.instance) {
            this.instance = new ClassLog();
        }
        return this.instance;
    }

    private static instance: ClassLog;

    private classLogModel: Sequelize.Model<ClassLogInstance, IClassLogModel>;

    private constructor() {
        this.classLogModel = classLogModel(Connection.getInstance().getConnection());
    }

    public add(
        StudentID: number,
        ClassID: number,
        StudyDate: Date,
        HybridSheetID: number,
        TutorID: number,
    ): Observable<IClassLogModel> {
        return from(this.classLogModel.create({ StudentID, ClassID, StudyDate, HybridSheetID, TutorID }));
    }

    public listByStudentID(
        StudentID: number,
    ): Observable<IClassLogModel[]> {
        return from(this.classLogModel.findAll<IClassLogModel>({
            raw: true,
            where: { StudentID },
        }));
    }

    public listInDate(
        StudyDate: Date,
    ): Observable<IClassLogModel[]> {
        return from(this.classLogModel.findAll<IClassLogModel>({
            raw: true,
            where: { StudyDate },
        }));
    }

    public edit(
        ID: number,
        value: Partial<IClassLogModel>,
    ): Observable<number> {
        let updateValue = {} as Partial<IClassLogModel>;
        if (value.CheckInTime) {
            updateValue = { ...updateValue, CheckInTime: value.CheckInTime };
        }
        if (value.CheckOutTime) {
            updateValue = { ...updateValue, CheckOutTime: value.CheckOutTime };
        }
        if (value.HybridSheetID) {
            updateValue = { ...updateValue, HybridSheetID: value.HybridSheetID };
        }
        if (value.TutorID) {
            updateValue = { ...updateValue, TutorID: value.TutorID };
        }
        if (value.Progress) {
            updateValue = { ...updateValue, Progress: value.Progress };
        }
        return from(this.classLogModel.update(updateValue, { where: { ID } }))
            .pipe(
                map((result) => result[0]),
        );
    }

    public delete(
        ID: number,
    ): Observable<number> {
        return from(this.classLogModel.destroy({ where: { ID } }));
    }
}
