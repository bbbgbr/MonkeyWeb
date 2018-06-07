import * as mongoose from "mongoose";
import { Document, Schema } from "mongoose";
import { Observable } from "rx";
import { UpdateResponse } from "./Constants";

interface CalendarInterface extends Document {
    title: String,
    tag: String,
    ownerID: Number,
    startDate: Date,
    endDate: Date
}

let calendarSchema = new Schema({
    title: String,
    tag: String,
    ownerID: Number,
    startDate: Date,
    endDate: Date
});

let CalendarModel = mongoose.model<CalendarInterface>("Calendar", calendarSchema, "calendar");

export class Calendar {

    private calendar: CalendarInterface;

    constructor(calendar: CalendarInterface) {
        this.calendar = calendar;
    }

    getInterface(): CalendarInterface {
        return this.calendar;
    }

    getID(): mongoose.Types.ObjectId {
        return this.calendar._id
    }

    delete(): Observable<UpdateResponse> {
        return Observable.fromPromise(CalendarModel.deleteOne({
            _id: this.getID()
        }));
    }

    setTitle(title: string): Observable<Calendar> {
        return this.edit({
            title: title
        });
    }

    setTag(tag: string): Observable<Calendar> {
        return this.edit({
            tag: tag
        });
    }

    setOwnerID(ownerID: number): Observable<Calendar> {
        return this.edit({
            ownerID: ownerID
        });
    }

    setStartDate(startDate: Date): Observable<Calendar> {
        return this.edit({
            startDate: startDate
        });
    }

    setEndDate(endDate: Date): Observable<Calendar> {
        return this.edit({
            endDate: endDate
        });
    }

    private edit(value: any): Observable<Calendar> {
        return Observable.fromPromise(CalendarModel.findByIdAndUpdate(this.getID(), {
            $set: value
        })).map(calendar => new Calendar(calendar));
    }

}

export class CalendarManager {

    static add(title: string, tag: string, ownerID: number, startDate: Date, endDate: Date): Observable<Calendar> {
        let calendar = new CalendarModel({
            title: title,
            tag: tag,
            ownerID: ownerID,
            startDate: startDate,
            endDate: endDate
        });
        return Observable.fromPromise(calendar.save())
            .map(calendar => new Calendar(calendar));
    }

    static find(id: mongoose.Types.ObjectId | string): Observable<Calendar> {
        if (typeof id === "string") id = new mongoose.Types.ObjectId(id);
        return Observable.fromPromise(CalendarModel.findById(id))
            .map(calendar => new Calendar(calendar));
    }

    static findRange(startDate: Date, endDate: Date): Observable<Calendar[]> {
        return Observable.fromPromise(CalendarModel.find({
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
        }))
            .map(calendars => calendars.map(calendar => new Calendar(calendar)));
    }

}