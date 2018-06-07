import * as mongoose from "mongoose";
import { Document, Schema } from "mongoose";
import { Observable } from "rx";
import { Course, CourseManager } from "./CourseManager";
import { Hybrid, HybridManager } from "./HybridManager";
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
        return Observable.fromPromise(StudentModel.findById(userID as Number))
            .map(student => new Student(student));
    }

    static getTutorInfo(userID: number): Observable<Tutor> {
        return Observable.fromPromise(TutorModel.findById(userID as Number))
            .map(tutor => new Tutor(tutor));
    }

    static listTutor(): Observable<Tutor[]> {
        return Observable.fromPromise(TutorModel.find({
            tutor: {
                $exists: true
            },
            "tutor.status": "active"
        })
        .sort({
            _id: 1
        }))
            .map(tutors => tutors.map(tutor => new Tutor(tutor)));
    }
}

abstract class User<T extends UserInterface> {

    protected user: T

    constructor(user: T) {
        this.user = user;
    }

    getID(): number {
        return this.user._id.valueOf();
    }

    getNicknameEn(): string {
        return this.user.nicknameEn.valueOf();
    }

    getInterface(): T {
        return this.user;
    }
}


export class Student extends User<StudentInterface> {

    constructor(student: StudentInterface) {
        super(student);
    }

    getRegistrationQuarter(): Observable<[Course[], Hybrid[], Skill[]]> {
        return Observable.zip(
            CourseManager.findCourseContainStudent(this.getID()),
            HybridManager.findHybridContainStudent(this.getID()),
            SKillManager.findSkillContainStudent(this.getID())
        );
    }

}

export class Tutor extends User<TutorInterface> {

    constructor(tutor: TutorInterface) {
        super(tutor);
    }

}