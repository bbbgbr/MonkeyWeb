import { Router } from "express";
import { UserManager } from "./classes/UserManager";

export const router = Router();

router.post("/list", (req,res) => {
    UserManager.listTutor()
    .map(tutors => tutors.map(tutor => tutor.getInterface()))
    .subscribe(tutors => {
        return res.status(200).send({
            tutors: tutors.map(tutor => {
                let newTutor = tutor;
                newTutor.password = "";
                return newTutor;
            })
        });
    });
});