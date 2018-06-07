import * as mongoose from "mongoose";
import { Document, Schema } from "mongoose";
import { Observable } from "rx";
import { QuarterManager } from "./QuarterManager";

interface CourseInterface extends Document {
    subject: String,
    grade: Number,
    level: String,
    day: Number,
    tutor: [Number],
    student: [Number],
    submission: [String],
    room: Number,
    year: Number,
    quarter: Number
}

let courseSchema = new Schema({
    subject: String,
    grade: Number,
    level: String,
    day: Number,
    tutor: [Number],
    student: [Number],
    room: Number,
    year: Number,
    quarter: Number
});

let CourseModel = mongoose.model<CourseInterface>('Course', courseSchema, 'course');

export class CourseManager {

    static getCourseInQuarter(quarterID: string): Observable<Course[]> {
        return QuarterManager.getQuarter(quarterID)
            .flatMap(quarter => {
                return Observable.fromPromise(CourseModel.find({
                    year: quarter.getYear(),
                    quarter: quarter.getQuarter()
                }));
            })
            .map(courses => courses.map(course => new Course(course)));
    }

    static findCourseContainStudent(studentID: number): Observable<Course[]> {
        return Observable.fromPromise(CourseModel.find({
            student: studentID
        }))
        .map(courses => courses.map(course => new Course(course)));
    }
}

export class Course {
    course: CourseInterface;

    constructor(course: CourseInterface) {
        this.course = course
    }

    getQuarterID(): string {
        let year = this.course.year + '';
        let quarter = this.course.quarter + ''
        if (quarter.length === 1) quarter = '0' + quarter;
        return year + quarter;
    }

    getStudentID(): number[] {
        return this.course.student.map(id => id.valueOf());
    }
}