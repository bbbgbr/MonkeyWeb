import { Router } from "express";
import * as _ from "lodash";
import { UserManager } from "./classes/UserManager";

export const router = Router();

router.post("/getRegistrationQuarter", (req, res) => {
    if (!req.body.studentID) {
        return res.status(400).send({
            err: -1,
            msg: "Bad Request"
        });
    }
    UserManager.getStudentInfo(parseInt(req.body.studentID))
        .flatMap(student => student.getRegistrationQuarter())
        .subscribe(registration => {
            return res.status(200).send({
                registration: {
                    course: _.uniq(registration[0].map(course => course.getQuarterID())),
                    hybrid: _.uniq(registration[1].map(hybrid => hybrid.getQuarterID())),
                    skill: _.uniq(registration[2].map(skill => skill.getQuarterID()))
                }
            });
        });
});