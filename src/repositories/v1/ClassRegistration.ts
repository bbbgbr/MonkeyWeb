import { from, Observable, PartialObserver } from 'rxjs';
import * as Sequelize from 'sequelize';
import { Connection } from '../../models/Connection';
import { ClassRegistrationInstance, classRegistrationModel, IClassRegistrationModel } from '../../models/v1/classRegistration';

export class ClassRegistration {

    public static getInstance(): ClassRegistration {
        if (!this.instance) {
            this.instance = new ClassRegistration();
        }
        return this.instance;
    }

    private static instance: ClassRegistration;

    private classRegistrationModel: Sequelize.Model<ClassRegistrationInstance, IClassRegistrationModel>;

    private constructor() {
        this.classRegistrationModel = classRegistrationModel(Connection.getInstance().getConnection());
    }

    public add(
        StudentID: number,
        ClassID: number,
    ): Observable<IClassRegistrationModel> {
        return from(this.classRegistrationModel.create({ StudentID, ClassID }));
    }

    public bulkAdd(
        StudentID: number,
        classesID: number[],
    ): Observable<IClassRegistrationModel[]> {
        const value: IClassRegistrationModel[] = [];
        classesID.forEach((element) => {
            value.push({ StudentID, ClassID: element });
        });
        return from(this.classRegistrationModel.bulkCreate(value));
    }

    public delete(
        ID: number,
    ): Observable<number> {
        return from(this.classRegistrationModel.destroy({ where: { ID } }));
    }

    public deleteByClass(
        StudentID: number,
        ClassID: number,
    ): Observable<number> {
        return from(this.classRegistrationModel.destroy({ where: { StudentID, ClassID } }));
    }

    public listStudentClass(
        ID: number,
        QuarterID: number,
    ) {
        const statement = 'SELECT * ' +
            'FROM ClassRegistration ' +
            '   JOIN Class ON Class.ID = ClassRegistration.ClassID ' +
            'WHERE ClassRegistration.StudentID = :ID AND Class.QuarterID = :QuarterID';
        return Connection.getInstance().query(statement,
            {
                raw: true,
                replacements: { ID, QuarterID },
                type: Sequelize.QueryTypes.SELECT,
            },
        );
    }
}
