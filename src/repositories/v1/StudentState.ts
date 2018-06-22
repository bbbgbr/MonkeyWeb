import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import * as Sequelize from 'sequelize';
import { Connection } from '../../models/Connection';
import { IStudentStateModel, StudentStateInstance, studentStateModel, UserRegistrationStage } from '../../models/v1/studentState';

export class StudentState {

    public static getInstance(): StudentState {
        if (!this.instance) {
            this.instance = new StudentState();
        }
        return this.instance;
    }

    private static instance: StudentState;

    private studentStateModel: Sequelize.Model<StudentStateInstance, IStudentStateModel>;

    private constructor() {
        this.studentStateModel = studentStateModel(Connection.getInstance().getConnection());
    }

    public add(
        StudentID: number,
        QuarterID: number,
        Grade: number,
        Stage: UserRegistrationStage,
    ): Observable<IStudentStateModel> {
        return from(this.studentStateModel.create({
            // tslint:disable-next-line:object-literal-sort-keys
            StudentID, QuarterID, Grade, Stage,
        }));
    }

    public edit(
        StudentID: number,
        QuarterID: number,
        value: Partial<IStudentStateModel>,
    ): Observable<number> {
        let updateValue = {} as Partial<IStudentStateModel>;
        if (value.Grade) {
            updateValue = { ...updateValue, Grade: value.Grade };
        }
        if (value.StudentLevel) {
            updateValue = { ...updateValue, StudentLevel: value.StudentLevel };
        }
        if (value.Stage) {
            updateValue = { ...updateValue, Stage: value.Stage };
        }
        if (value.Remark) {
            updateValue = { ...updateValue, Remark: value.Remark };
        }
        return from(this.studentStateModel.update(updateValue, { where: { StudentID, QuarterID } }))
            .pipe(
                map((result) => result[0]),
        );
    }
}
