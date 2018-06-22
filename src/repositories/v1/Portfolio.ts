import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import * as Sequelize from 'sequelize';
import { Connection } from '../../models/Connection';
import { IPortfolioModel, PortfolioInstance, portfolioModel } from '../../models/v1/portfolio';

export class Portfolio {

    public static getInstance(): Portfolio {
        if (!this.instance) {
            this.instance = new Portfolio();
        }
        return this.instance;
    }

    private static instance: Portfolio;

    private portfolioModel: Sequelize.Model<PortfolioInstance, IPortfolioModel>;

    private constructor() {
        this.portfolioModel = portfolioModel(Connection.getInstance().getConnection());
    }

    public add(
        StudentID: number,
        HybridSheetID: number,
    ): Observable<IPortfolioModel> {
        return from(this.portfolioModel.create({ HybridSheetID, StudentID }));
    }

    public getUserPortfolio(
        StudentID: number,
    ): Observable<IPortfolioModel[]> {
        return from(this.portfolioModel.findAll<IPortfolioModel>({
            raw: true,
            where: { StudentID },
        }));
    }

    public edit(
        ID: number,
        value: Partial<IPortfolioModel>,
    ): Observable<number> {
        let updateValue = {} as Partial<IPortfolioModel>;
        if (value.StartDate) {
            updateValue = { ...updateValue, StartDate: value.StartDate };
        }
        if (value.EndDate) {
            updateValue = { ...updateValue, EndDate: value.EndDate };
        }
        if (value.Score) {
            updateValue = { ...updateValue, Score: value.Score };
        }
        return from(this.portfolioModel.update(updateValue, { where: { ID } }))
            .pipe(
                map((result) => result[0]),
        );
    }

    public delete(
        ID: number,
    ): Observable<number> {
        return from(this.portfolioModel.destroy({ where: { ID } }));
    }

}
