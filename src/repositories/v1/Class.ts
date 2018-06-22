import { forkJoin, from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import * as Sequelize from 'sequelize';
import { Connection } from '../../models/Connection';
import { ClassInstance, classModel, IClassInfo, IClassList, IClassModel } from '../../models/v1/class';
import { IRoomName } from '../../models/v1/room';
import { IGradeStudentState } from '../../models/v1/studentState';
import { IUserFullNameEn, IUserFullNameTh, IUserNicknameEn } from '../../models/v1/user';

export type StudentInClass = IUserFullNameTh & IGradeStudentState & { CountCourse: number, CountHybrid: number };
export type ClassInfo = IClassInfo & IUserFullNameEn;
export type ClassList = IClassList & IRoomName & IUserNicknameEn & { StudentCount: number };

export class Class {
    public static getInstance(): Class {
        if (!this.instance) {
            this.instance = new Class();
        }
        return this.instance;
    }

    private static instance: Class;

    private classModel: Sequelize.Model<ClassInstance, IClassModel>;

    private constructor() {
        this.classModel = classModel(Connection.getInstance().getConnection());
    }

    public getModel(): Sequelize.Model<ClassInstance, IClassModel> {
        return this.classModel;
    }

    public addCourse(
        ClassName: string,
        QuarterID: number,
        ClassDate: Date,
        ClassSubject: string,
        Grade: string,
        TutorID: number,
        ClassTimes: number,
    ): Observable<IClassModel> {
        return from(
            this.classModel.create({
                // tslint:disable-next-line:object-literal-sort-keys
                ClassName, QuarterID, ClassDate, ClassSubject, Grade, TutorID, ClassTimes, ClassType: 'Course',
            }),
        );
    }

    public addHybrid(
        ClassName: string,
        QuarterID: number,
        ClassDate: Date,
        ClassSubject: string,
    ): Observable<IClassModel> {
        return from(
            this.classModel.create({
                // tslint:disable-next-line:object-literal-sort-keys
                ClassName, QuarterID, ClassDate, ClassSubject, ClassType: 'Hybrid',
            }),
        );
    }

    public addSkill(
        ClassName: string,
        QuarterID: number,
        ClassDate: Date,
        ClassSubject: string,
    ): Observable<IClassModel> {
        return from(
            this.classModel.create({
                // tslint:disable-next-line:object-literal-sort-keys
                ClassName, QuarterID, ClassDate, ClassSubject, ClassType: 'Skill',
            }),
        );
    }

    public deleteClass(
        ID: number,
    ): Observable<number> {
        return from(this.classModel.destroy({ where: { ID } }));
    }

    public getClass(
        ClassName: string,
        QuarterID: number,
        ClassDate: Date,
        ClassSubject: string,
        ClassType: string,
    ): Observable<IClassModel[]> {
        const where: Partial<IClassModel> = {};
        if (ClassName) {
            where.ClassName = ClassName;
        }
        if (QuarterID) {
            where.QuarterID = QuarterID;
        }
        if (ClassDate) {
            where.ClassDate = ClassDate;
        }
        if (ClassSubject) {
            where.ClassSubject = ClassSubject;
        }
        if (ClassType) {
            where.ClassType = ClassType;
        }
        return from(this.classModel.findAll({ where }));
    }

    public getClassInfo(
        ID: number,
    ): Observable<{ info: IClassInfo, students: StudentInClass[] }> {
        return forkJoin(
            this.getInfo(ID),
            this.listStudentInClass(ID),
        ).pipe(
            map((result) => ({ info: result[0], students: result[1] })),
        );
    }

    public edit(
        ID: number,
        value: Partial<IClassModel>,
    ): Observable<number> {
        let updateValue = {} as Partial<IClassModel>;
        if (value.ClassName) {
            updateValue = { ...updateValue, ClassName: value.ClassName };
        }
        if (value.QuarterID) {
            updateValue = { ...updateValue, QuarterID: value.QuarterID };
        }
        if (value.ClassDate) {
            updateValue = { ...updateValue, ClassDate: value.ClassDate };
        }
        if (value.ClassSubject) {
            updateValue = { ...updateValue, ClassSubject: value.ClassSubject };
        }
        if (value.Grade) {
            updateValue = { ...updateValue, Grade: value.Grade };
        }
        if (value.TutorID) {
            updateValue = { ...updateValue, TutorID: value.TutorID };
        }
        if (value.RoomID) {
            updateValue = { ...updateValue, RoomID: value.RoomID };
        }
        if (value.ClassDescription) {
            updateValue = { ...updateValue, ClassDescription: value.ClassDescription };
        }
        if (value.Suggestion) {
            updateValue = { ...updateValue, Suggestion: value.Suggestion };
        }
        if (value.ClassTimes) {
            updateValue = { ...updateValue, ClassTimes: value.ClassTimes };
        }
        if (value.ClassType) {
            updateValue = { ...updateValue, ClassType: value.ClassType };
        }
        return from(this.classModel.update(updateValue, { where: { ID } }))
            .pipe(
                map((result) => result[0]),
        );
    }

    public list(
        QuarterID: number,
        ClassType?: string,
    ): Observable<ClassList[]> {
        let replacements: Partial<IClassModel> = { QuarterID };
        let statement =
            `SELECT Class.ID, Class.ClassName, Class.ClassDate, Class.Grade, Room.RoomName, Users.NicknameEn, (
                SELECT COUNT(*)
                FROM ClassRegistration
                    LEFT JOIN Users ON ClassRegistration.StudentID = Users.ID
                    LEFT JOIN StudentState ON Users.ID = StudentState.StudentID
               WHERE ClassRegistration.ClassID = Class.ID AND Users.UserStatus <> \'terminated\' AND StudentState.Stage <> \'dropped\' AND StudentState.QuarterID = Class.QuarterID
            ) AS StudentCount
            FROM Class
                LEFT JOIN Room ON Class.RoomID = Room.ID
                LEFT JOIN Users ON Class.TutorID = Users.ID
            WHERE Class.QuarterID = :QuarterID`;
        if (ClassType) {
            statement += 'AND Class.ClassType = :ClassType';
            replacements = { ...replacements, ClassType };
        }
        return Connection.getInstance().query<ClassList>(statement, {
            raw: true,
            replacements,
            type: Sequelize.QueryTypes.SELECT,
        });
    }

    private getInfo(
        ID: number,
    ): Observable<ClassInfo> {
        const statement =
            `SELECT Class.ClassName, Class.ClassDate, Class.ClassDescription, Class.TutorID, Class.RoomID, Class.Grade, Class.ClassTimes, Class.ClassType, Users.FirstnameEn, Users.LastnameEn, Users.NicknameEn
            FROM Class
                JOIN Users ON Users.ID = Class.TutorID
            WHERE Class.ID = :ID`;
        return Connection.getInstance().query<ClassInfo>(statement, {
            raw: true,
            replacements: { ID },
            type: Sequelize.QueryTypes.SELECT,
        },
        ).pipe(
            map((result) => result[0]),
        );
    }

    private listStudentInClass(
        ID: number,
    ): Observable<StudentInClass[]> {
        const statement =
            `SELECT Users.ID, StudentState.Grade, Users.Nickname, Users.Firstname, Users.Lastname, (
                SELECT COUNT(*)
                FROM ClassRegistration
                    JOIN Class course ON course.ID = ClassRegistration.ClassID
                WHERE ClassRegistration.StudentID = Users.ID AND course.QuarterID = Class.QuarterID AND course.ClassType = \'Course\'
            ) AS CountCourse, (
                SELECT COUNT(*)
                FROM ClassRegistration
                    JOIN Class course ON course.ID = ClassRegistration.ClassID
               WHERE ClassRegistration.StudentID = Users.ID AND course.QuarterID = Class.QuarterID AND course.ClassType = \'Hybrid\'
            ) AS CountHybrid
            FROM Class
                JOIN ClassRegistration ON ClassRegistration.ClassID = Class.ID
                JOIN Users ON ClassRegistration.StudentID = Users.ID
                JOIN StudentState ON Class.QuarterID = StudentState.QuarterID AND Users.ID = StudentState.StudentID
            WHERE StudentState.Stage <> \'dropped\' AND Users.UserStatus <> \'terminated\' AND Class.ID = :ID`;
        return Connection.getInstance().query<StudentInClass>(statement,
            {
                raw: true,
                replacements: { ID },
                type: Sequelize.QueryTypes.SELECT,
            },
        );
    }

}
