import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import * as Sequelize from 'sequelize';
import { Connection } from '../../models/Connection';
import { IQuarterModel, QuarterInstance, quarterModel } from '../../models/v1/quarter';

export class Quarter {

    public static getInstance(): Quarter {
        if (!this.instance) {
            this.instance = new Quarter();
        }
        return this.instance;
    }

    private static instance: Quarter;

    private quarterModel: Sequelize.Model<QuarterInstance, IQuarterModel>;

    private constructor() {
        this.quarterModel = quarterModel(Connection.getInstance().getConnection());
    }

    public getModel(): Sequelize.Model<QuarterInstance, IQuarterModel> {
        return this.quarterModel;
    }

    public listQuarter(): Observable<IQuarterModel[]> {
        return from(this.quarterModel.findAll({ raw: true }));
    }

    public add(
        QuarterName: string,
        Type: string,
    ): Observable<IQuarterModel> {
        return from(this.quarterModel.create({ QuarterName, Type }));
    }

    public edit(
        ID: number,
        value: Partial<IQuarterModel>,
    ): Observable<number> {
        let updateValue = {} as Partial<IQuarterModel>;
        if (value.StartDate) {
            updateValue = { ...updateValue, StartDate: value.StartDate };
        }
        if (value.EndDate) {
            updateValue = { ...updateValue, EndDate: value.EndDate };
        }
        if (value.QuarterName) {
            updateValue = { ...updateValue, QuarterName: value.QuarterName };
        }
        return from(this.quarterModel.update(updateValue, { where: { ID } }))
            .pipe(
                map((quarter) => quarter[0]),
        );
    }

    public delete(
        ID: number,
    ): Observable<number> {
        return from(this.quarterModel.destroy({ where: { ID } }));
    }

}
