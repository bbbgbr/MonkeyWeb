import { Router } from "express";

export const router = Router();

// router.post("/list", (req,res) => {
//     ConfigManager.getConfig().flatMap(config => {
//         return QuarterManager.getQuarterFromQuarterObject(config.getDefualtQuarter());
//     }).flatMap(defaultQuarter => {
//         return Observable.zip(
//             CourseManager.getCourseInQuarter(defaultQuarter.getQuarterID()),
//             CourseManager.getCourseInQuarter(defaultQuarter.getQuarterID()).flatMap(courses => {
//                 return Observable.forkJoin(courses.map(course => {
//                     return Observable.forkJoin(course.getStudentID().map(id => {
//                         return UserManager.getStudentInfo(id);
//                     }));
//                 })
//             }
//         )
//         // return CourseManager.getCourseInQuarter(defaultQuarter.getQuarterID());
//     })
// });