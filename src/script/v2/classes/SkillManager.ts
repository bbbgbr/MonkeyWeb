import * as mongoose from "mongoose";
import { Document, Schema } from "mongoose";
import { Observable } from "rx";

interface SkillInterface extends Document {
    quarterID: String,
    day: Number,
    student: [{
        studentID: Number,
        subject: String
    }]
}

let skillSchema = new Schema({
    quarterID: String,
    day: Number,
    student: [{
        studentID: Number,
        subject: String
    }]
});

let SkillModel = mongoose.model<SkillInterface>('Skill', skillSchema, 'skillStudent');

export class SKillManager {
    static getSkillForQuarter(quarterID: string): Observable<Skill> {
        return Observable.fromPromise(SkillModel.findOne({
            quarterID: quarterID
        }))
            .map(skill => new Skill(skill));
    }

    static findSkillContainStudent(studentID: number): Observable<Skill[]> {
        return Observable.fromPromise(SkillModel.find({
            "student.studentID": studentID
        }))
            .map(skills => skills.map(skill => new Skill(skill)));
    }
}

export class Skill {
    skill: SkillInterface

    constructor(skill: SkillInterface) {
        this.skill = skill;
    }

    getQuarterID(): String {
        return this.skill.quarterID.toString();
    }
}