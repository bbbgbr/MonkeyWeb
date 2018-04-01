import { Document, Schema, Mongoose } from "mongoose";
import * as mongoose from "mongoose";
import { Observable } from "rx";
import { CourseManager, Course } from "./CourseManager";
import { HybridManager, Hybrid } from "./HybridManager";
import { SKillManager, Skill } from "./SkillManager";

interface UserInterface extends Document {
    _id: Number,
    password: String,
    position: String,
    firstname: String,
    lastname: String,
    nickname: String,
    firstnameEn: String,
    lastnameEn: String,
    nicknameEn: String,
    email: String,
    phone: String
}

export interface TutorInterface extends UserInterface {
    tutor: {
        status: String
    },
    subPosition: String
}

export interface StudentInterface extends UserInterface {
    student: {
        grade: Number,
        skillday: any[],
        phoneParent: String,
        status: String,
        quarter: {
            year: Number,
            quarter: Number,
            registrationState: String,
            subRegistrationState: String
        }[],
        level: String,
        remark: String
    }
}

let studentSchema = new Schema({
    _id: Number,
    password: String,
    position: String,
    firstname: String,
    lastname: String,
    nickname: String,
    firstnameEn: String,
    lastnameEn: String,
    nicknameEn: String,
    email: String,
    phone: String,
    student: {
        grade: Number,
        skillday: [],
        phoneParent: String,
        status: String,
        quarter: [{
            year: Number,
            quarter: Number,
            registrationState: String,
            subRegistrationState: String
        }],
        level: String,
        remark: String
    }
});

let tutorSchema = new Schema({
    _id: Number,
    password: String,
    position: String,
    firstname: String,
    lastname: String,
    nickname: String,
    firstnameEn: String,
    lastnameEn: String,
    nicknameEn: String,
    email: String,
    phone: String,
    tutor: {
        status: String
    },
    subPosition: String
});

export let StudentModel = mongoose.model<StudentInterface>("Student", studentSchema, "user");
export let TutorModel = mongoose.model<TutorInterface>("Tutor", tutorSchema, "user");


export class UserManager {

    static getStudentInfo(userID: number): Observable<Student> {
        return Observable.fromPromise(StudentModel.findById(userID as Number)).map(student => new Student(student));
    }

    static getTutorInfo(userID: number): Observable<Tutor> {
        return Observable.fromPromise(TutorModel.findById(userID as Number)).map(tutor => new Tutor(tutor));
    }
}

abstract class User {

    user: UserInterface

    constructor(user: UserInterface) {
        this.user = user
    }

    getID(): number {
        return this.user._id.valueOf();
    }
}

export class Student extends User {

    student: StudentInterface

    constructor(student: StudentInterface) {
        super(student);
        student = this.user as StudentInterface;
    }

    getRegistrationQuarter(): Observable<[Course[], Hybrid[], Skill[]]>{
        return Observable.zip(
            CourseManager.findCourseContainStudent(this.getID()),
            HybridManager.findHybridContainStudent(this.getID()),
            SKillManager.findSkillContainStudent(this.getID())
        );
    }
}

export class Tutor extends User {

    tutor: TutorInterface

    constructor(tutor: TutorInterface) {
        super(tutor);
        tutor = this.user as TutorInterface;
    }

    getNicknameEn(): string{
        return this.tutor.nicknameEn.toString();
    }
}