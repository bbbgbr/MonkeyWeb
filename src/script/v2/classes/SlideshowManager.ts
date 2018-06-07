import * as mongoose from "mongoose";
import { Document, Schema } from "mongoose";
import { join } from "path";
import { Observable } from "rx";
import { UpdateResponse } from "./Constants";

export enum SlideshowType {
    NEWS = 0,
    STUDENT_PORTAIT = 1,
    STUDENT_LANDSCAPE = 2
}

interface SlideshowInterface extends Document {
    startDate: Date,
    endDate: Date,
    fileName: String,
    path: String,
    type: Number
}

export interface SlideshowResponse {
    startDate: Date,
    endDate: Date,
    fileName: string,
    path: string,
    type: number,
    link: string
}

let slideshowSchema = new Schema({
    startDate: Date,
    endDate: Date,
    fileName: String,
    path: String,
    type: Number
});

export let SlideshowModel = mongoose.model<SlideshowInterface>('SlideshowModel', slideshowSchema, 'slideshow');

export class Slideshow {
    slideshow: SlideshowInterface

    constructor(slideshow: SlideshowInterface) {
        this.slideshow = slideshow;
    }

    getID(): mongoose.Types.ObjectId {
        return this.slideshow._id;
    }

    getPath(): string {
        return this.slideshow.path.toString();
    }

    getSlideshowResponse(): SlideshowResponse {
        return {
            startDate: this.slideshow.startDate,
            endDate: this.slideshow.endDate,
            fileName: this.slideshow.fileName.valueOf(),
            path: this.slideshow.path.valueOf(),
            type: this.slideshow.type.valueOf(),
            link: encodeURI(process.env.SLIDESHOW_BASE_NAME + "?id=" + this.slideshow._id)
        };
    }
}

export class SlideshowManager {

    static getPath(fileName: string): string {
        return join(process.env.SLIDESHOW_PATH, fileName);
    }

    static addSlideshowImage(startDate: Date, endDate: Date, fileName: string, path: string, type: number): Observable<Slideshow> {
        let slideshow = new SlideshowModel({
            startDate: startDate,
            endDate: endDate,
            fileName: fileName,
            path: path,
            type: type
        });
        return Observable.fromPromise(slideshow.save()).map(slideshow => new Slideshow(slideshow));
    }

    static addSlideshowImages(startDate: Date, endDate: Date, files: Express.Multer.File[], type: number): Observable<Slideshow[]> {
        return Observable.forkJoin(files.map(file => {
            return this.addSlideshowImage(startDate, endDate, file.filename, this.getPath(file.filename), type);
        }));
    }


    static getSlideshow(slideshowID: string | mongoose.Types.ObjectId): Observable<Slideshow> {
        if (slideshowID! instanceof mongoose.Types.ObjectId) slideshowID = new mongoose.Types.ObjectId(slideshowID);
        return Observable.fromPromise(SlideshowModel.findById(slideshowID))
            .map(slideshow => new Slideshow(slideshow));
    }

    static deleteSlideshow(slideshowID: string | mongoose.Types.ObjectId): Observable<UpdateResponse> {
        if (slideshowID! instanceof mongoose.Types.ObjectId) slideshowID = new mongoose.Types.ObjectId(slideshowID);
        return Observable.fromPromise(SlideshowModel.deleteOne({
            _id: slideshowID
        }));
    }

    static listSlideshow(startDate: Date, endDate: Date): Observable<Slideshow[]> {
        return Observable.fromPromise(SlideshowModel.find({
            $or: [{
                $and: [
                    { startDate: { $gte: startDate } },
                    { startDate: { $lte: endDate } }
                ]
            }, {
                $and: [
                    { endDate: { $gte: startDate } },
                    { endDate: { $lte: endDate } }
                ]
            }]
        }).sort({
            startDate: -1
        }))
            .map(slideshows => slideshows.map(slideshow => new Slideshow(slideshow)));
    }
}