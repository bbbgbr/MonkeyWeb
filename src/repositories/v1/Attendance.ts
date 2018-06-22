import { from, Observable } from 'rxjs';
import { flatMap, map } from 'rxjs/operators';
import * as Sequelize from 'sequelize';
import * as uuid from 'uuid';
import { Connection } from '../../models/Connection';
import { AttendanceInstance, attendanceModel, IAttendanceModel } from '../../models/v1/attendance';
import { FileManager } from './FileManager';

export class Attendance {

    public static getInstance(): Attendance {
        if (!this.instance) {
            this.instance = new Attendance();
        }
        return this.instance;
    }

    private static instance: Attendance;

    private attendanceModel: Sequelize.Model<AttendanceInstance, IAttendanceModel>;

    private constructor() {
        this.attendanceModel = attendanceModel(Connection.getInstance().getConnection());
    }

    public add(
        StudentID: number,
        ClassID: number,
        AttendanceDate: Date,
        AttendanceType: string,
        Reason: string,
        Sender: string,
        AttendanceDocument?: Express.Multer.File,
    ): Observable<IAttendanceModel> {
        const value = {
            AttendanceDate, AttendanceType, ClassID, Reason, Sender, StudentID,
        } as IAttendanceModel;
        if (AttendanceDocument) {
            const fileName = uuid.v1();
            return FileManager.getInstance().uploadAttendanceImage(fileName, AttendanceDocument).pipe(
                flatMap((blob) => from(this.attendanceModel.create({ ...value, AttendanceDocument: fileName }))),
            );
        } else {
            return from(this.attendanceModel.create(value));
        }
    }

    public bulkAdd(
        StudentID: number,
        ClassID: number[],
        AttendanceDate: Date,
        AttendanceType: string,
        Reason: string,
        Sender: string,
        AttendanceDocument?: Express.Multer.File,
    ): Observable<IAttendanceModel[]> {
        const value: IAttendanceModel[] = [];
        const fileName = uuid.v1();
        ClassID.forEach((element) => {
            if (AttendanceDocument) {
                value.push({
                    AttendanceDate, AttendanceDocument: fileName, AttendanceType, ClassID: element, Reason, Sender, StudentID,
                });
            } else {
                value.push({
                    AttendanceDate, AttendanceType, ClassID: element, Reason, Sender, StudentID,
                });
            }
        });
        if (AttendanceDocument) {
            return FileManager.getInstance().uploadAttendanceImage(fileName, AttendanceDocument).pipe(
                flatMap((result) => from(this.attendanceModel.bulkCreate(value))),
            );
        } else {
            return from(this.attendanceModel.bulkCreate(value));
        }
    }

    public getPath(
        ID: number,
    ): Observable<string> {
        return from(this.attendanceModel.findOne<string>({
            attributes: {
                include: ['AttendanceDocument'],
            },
            where: { ID },
        })).pipe(
            map((result) => result.AttendanceDocument),
            flatMap((fileName) => FileManager.getInstance().downloadAttendanceImage(fileName)),
        );
    }

    public delete(
        ID: number,
    ): Observable<number> {
        return from(this.attendanceModel.destroy({ where: { ID } }));
    }

    public edit(
        ID: number,
        value: Partial<IAttendanceModel>,
    ): Observable<number> {
        let updateValue = {} as Partial<IAttendanceModel>;
        if (value.AttendanceDate) {
            updateValue = { ...updateValue, AttendanceDate: value.AttendanceDate };
        }
        if (value.AttendanceType) {
            updateValue = { ...updateValue, AttendanceType: value.AttendanceType };
        }
        if (value.Reason) {
            updateValue = { ...updateValue, Reason: value.Reason };
        }
        if (value.Remark) {
            updateValue = { ...updateValue, Remark: value.Remark };
        }
        if (value.Sender) {
            updateValue = { ...updateValue, Sender: value.Sender };
        }
        return from(this.attendanceModel.update(updateValue, { where: { ID } }))
            .pipe(
                map((result) => result[0]),
        );
    }
}
