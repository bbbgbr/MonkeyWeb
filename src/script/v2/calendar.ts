import { Router } from "express";
import { Observable } from "rx";
import { CalendarManager } from "./classes/CalendarManager";

export const router = Router();

router.post("/add", (req, res) => {
    let { title, tag, ownerID, startDate, endDate } = req.body;
    if (!(title && tag && ownerID && startDate && endDate)) {
        return res.status(400).send({
            err: 0,
            msg: "Bad Request"
        });
    }
    CalendarManager.add(title, tag, parseInt(ownerID), new Date(startDate), new Date(endDate)).subscribe(_ => {
        return res.status(200).send({
            msg: "OK"
        });
    });
});

router.post("/delete", (req, res) => {
    let { calendarID } = req.body;
    if (!calendarID) {
        return res.status(400).send({
            err: 0,
            msg: "Bad Request"
        });
    }
    CalendarManager.find(calendarID)
        .flatMap(calendar => calendar.delete())
        .subscribe(_ => {
            return res.status(200).send({
                msg: "OK"
            });
        });
});

router.post("/edit", (req, res) => {
    let { calendarID, title, tag, ownerID, startDate, endDate } = req.body;
    if (!(calendarID && (title || tag || ownerID || startDate || endDate))) {
        return res.status(400).send({
            err: 0,
            msg: "Bad Request"
        });
    }
    CalendarManager.find(calendarID)
        .flatMap(calendar => {
            let observableArray = [];
            if (title) {
                observableArray.push(calendar.setTitle(title));
            }
            if (tag) {
                observableArray.push(calendar.setTag(tag));
            }
            if (ownerID) {
                observableArray.push(calendar.setOwnerID(parseInt(ownerID)));
            }
            if (startDate) {
                observableArray.push(calendar.setStartDate(new Date(startDate)));
            }
            if (endDate) {
                observableArray.push(calendar.setEndDate(new Date(endDate)));
            }
            return Observable.forkJoin(observableArray);
        })
        .subscribe(_ => {
            return res.status(200).send({
                msg: "OK"
            });
        });;
});

router.post("/list", (req, res) => {
    let { startDate, endDate } = req.body;
    if (!(startDate && endDate)) {
        return res.status(400).send({
            err: 0,
            msg: "Bad Request"
        });
    }
    CalendarManager.findRange(new Date(startDate), new Date(endDate)
    ).subscribe(calendars => {
        return res.status(200).send({
            calendars: calendars.map(calendar => calendar.getInterface())
        });
    });
});