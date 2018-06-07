import * as mongoose from "mongoose";
import { Document, Schema } from "mongoose";
import { Observable } from "rx";
import { start } from "repl";

interface QuarterInterface extends Document {
    year: Number,
    quarter: Number,
    name: String,
    maxSeat: [Number],
    status: String,
    startDate: Date,
    endDate: Date
}

let quarterSchema = new Schema({
    year: Number,
    quarter: Number,
    name: String,
    maxSeat: [Number],
    status: String,
    startDate: Date,
    endDate: Date
});

let QuarterModel = mongoose.model<QuarterInterface>('Quarter', quarterSchema, 'quarter');

export class QuarterManager {

    static getQuarter(quarterID: string): Observable<Quarter> {
        return Observable.fromPromise(QuarterModel.findById(quarterID))
            .map(quarter => new Quarter(quarter));
    }

    static getQuarterFromQuarterObject(quarter: { quarter: Number, year: Number }): Observable<Quarter> {
        return Observable.fromPromise(QuarterModel.findOne({
            quarter: quarter.quarter,
            year: quarter.year
        }))
            .map(quarter => new Quarter(quarter));
    }

}

declare function createLabel(id: number): number;

export class Quarter {

    private quarter: QuarterInterface

    constructor(quarter: QuarterInterface) {
        this.quarter = quarter
    }

    getID(): string {
        return this.quarter._id;
    }

    getYear(): number {
        return this.quarter.year.valueOf();
    }

    getQuarter(): number {
        return this.quarter.quarter.valueOf();
    }

    getQuarterID(): string {
        return this.quarter._id;
    }

    setStartEndDate(startDate: Date, endDate: Date): Observable<Quarter> {
        return this.edit({
            startDate: startDate,
            endDate: endDate
        });
    }

    private edit(value: any): Observable<Quarter> {
        return Observable.fromPromise(QuarterModel.findByIdAndUpdate(this.getID(), {
            $set: value
        }))
            .map(quarter => new Quarter(quarter));
    }
}
