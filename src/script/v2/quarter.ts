import { Router } from "express";
import { QuarterManager } from "./classes/QuarterManager";

export const router = Router();

router.post("/editDate", (req, res) => {
    let { quarterID, startDate, endDate } = req.body;
    if (!(startDate && endDate)) {
        return res.status(400).send({
            err: 0,
            msg: "Bad Request"
        });
    }
    QuarterManager.getQuarter(quarterID)
        .flatMap(quarter => quarter.setStartEndDate(new Date(startDate), new Date(endDate)))
        .subscribe(_ => {
            return res.status(200).send({
                msg: "OK"
            });
        });
});