import * as mongoose from "mongoose";
import { Document, Schema } from "mongoose";
import { Observable } from "rx";

interface HybridInterface extends Document {
    quarterID: String,
    day: Number,
    student: [{
        studentID: Number,
        subject: String
    }]
}

let hybridSchema = new Schema({
    quarterID: String,
    day: Number,
    student: [{
        studentID: Number,
        subject: String
    }]
});

let HybridModel = mongoose.model<HybridInterface>('Hybrid', hybridSchema, 'hybridStudent');

export class HybridManager {
    static getHybridForQuarter(quarterID: string): Observable<Hybrid> {
        return Observable.fromPromise(HybridModel.findOne({
            quarterID: quarterID
        }))
            .map(hybrid => new Hybrid(hybrid));
    }

    static findHybridContainStudent(studentID: number): Observable<Hybrid[]> {
        return Observable.fromPromise(HybridModel.find({
            "student.studentID": studentID
        }))
            .map(hybrids => hybrids.map(hybrid => new Hybrid(hybrid)));
    }
}

export class Hybrid {
    hybrid: HybridInterface

    constructor(hybrid: HybridInterface) {
        this.hybrid = hybrid;
    }

    getQuarterID(): string {
        return this.hybrid.quarterID.toString();
    }
}