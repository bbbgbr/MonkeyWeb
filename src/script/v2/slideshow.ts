import { Router } from "express";
import { FileManager } from "./classes/FileManager";
import { SlideshowManager, SlideshowResponse } from "./classes/SlideshowManager";

export const router = Router();

function formatDate(date: Date | string): Date {
    if (typeof date === "string") date = new Date(date);
    let newDate = new Date(0);
    newDate.setDate(date.getDate());
    newDate.setMonth(date.getMonth());
    newDate.setFullYear(date.getFullYear());
    return newDate;
}

router.post("/add", (req, res) => {
    if (!(req.files && req.body.startDate && req.body.endDate && req.body.type)) {
        return res.status(400).send({
            err: -1,
            msg: "Bad Request"
        });
    }
    FileManager.addSlideshowImage(req.files as Express.Multer.File[]);
    SlideshowManager.addSlideshowImages(formatDate(req.body.startDate), formatDate(req.body.endDate), req.files as Express.Multer.File[], parseInt(req.body.type))
        .subscribe(_ => {
            return res.status(200).send({ msg: "OK" });
        });
});

router.post("/remove", (req, res) => {
    if (!(req.body.slideshowID)) {
        return res.status(400).send({
            err: -1,
            msg: "Bad Request"
        });
    }
    SlideshowManager.getSlideshow(req.body.slideshowID)
        .flatMap(slideshow => {
            FileManager.removeSlideshowImage(slideshow.getPath());
            return SlideshowManager.deleteSlideshow(slideshow.getID());
        })
        .subscribe(_ => {
            return res.status(200).send({ msg: "OK" });
        });
});

router.post("/list", (req, res) => {
    if (!(req.body.startDate && req.body.endDate)) {
        return res.status(400).send({
            err: -1,
            msg: "Ok"
        });
    }
    SlideshowManager.listSlideshow(formatDate(req.body.startDate), formatDate(req.body.endDate))
        .subscribe(slideshows => {
            let slideshowResponse: SlideshowResponse[] = [];
            for (let i = 0; i < slideshows.length; i++) {
                slideshowResponse.push(slideshows[i].getSlideshowResponse());
            }
            return res.status(200).send(slideshowResponse);
        });
});

router.get("/img", (req, res) => {
    if (!req.query.id) {
        return res.status(400).send({
            err: -1,
            msg: "Bad Request"
        });
    }
    SlideshowManager.getSlideshow(req.query.id)
        .subscribe(slideshow => {
            return res.status(200).sendFile(slideshow.getPath());
        });
});