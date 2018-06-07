import * as mongoose from "mongoose";
import { Document, Schema } from "mongoose";
import { Observable } from "rx";
import { UpdateResponse } from "./Constants";

interface FeedbackInterface extends Document {
    feedbackFrom: Number,
    feedbackTo: Number,
    score: Number,
    type: String,
    refID?: mongoose.Types.ObjectId
}

let feedbackSchema = new Schema({
    feedbackFrom: Number,
    feedbackTo: Number,
    score: Number,
    type: String,
    refID: mongoose.Types.ObjectId
});

let FeedbackModel = mongoose.model<FeedbackInterface>("Feedback", feedbackSchema, "feedback");

enum FeedbackType {
    COURSE = "course",
    HYBRID = "hybrid"
}

export class Feedback {

    private feedback: FeedbackInterface;

    constructor(feedback: FeedbackInterface) {
        this.feedback = feedback;
    }

    getInterface(): FeedbackInterface {
        return this.feedback;
    }

    delete(): Observable<UpdateResponse> {
        return Observable.fromPromise(FeedbackModel.deleteOne(this.feedback._id));
    }
}

export class FeedbackManager {

    static add(feedback: Feedback): Observable<Feedback> {
        let feedbackModel = new FeedbackModel(feedback.getInterface());
        return Observable.fromPromise(feedbackModel.save())
            .map(feedback => new Feedback(feedback));
    }

    static getFeedback(feedbackID: mongoose.Types.ObjectId | string): Observable<Feedback> {
        if (typeof feedbackID === "string") feedbackID = new mongoose.Types.ObjectId(feedbackID);
        return Observable.fromPromise(FeedbackModel.findById(feedbackID))
            .map(feedback => new Feedback(feedback));
    }

    static getFeedbackForUserID(feedbackTo: Number): Observable<Feedback[]> {
        return this.findMany({
            feedbackTo: feedbackTo
        });
    }

    static getFeedbackForCourseID(courseID: string | mongoose.Types.ObjectId) {
        if (typeof courseID === "string") courseID = new mongoose.Types.ObjectId(courseID);
        return this.getFeedbackCourse(courseID);
    }

    static getFeedbackForHybirdID(hybridID: string | mongoose.Types.ObjectId) {
        if (typeof hybridID === "string") hybridID = new mongoose.Types.ObjectId(hybridID);
        return this.getFeedbackHybrid(hybridID);
    }

    private static getFeedbackCourse(courseID: mongoose.Types.ObjectId): Observable<Feedback[]> {
        return this.findMany({
            type: FeedbackType.COURSE,
            refID: courseID
        });
    }

    private static getFeedbackHybrid(hybridID: mongoose.Types.ObjectId): Observable<Feedback[]> {
        return this.findMany({
            type: FeedbackType.HYBRID,
            refID: hybridID
        });
    }

    private static findMany(queryObject: any): Observable<Feedback[]> {
        return Observable.fromPromise(FeedbackModel.find(queryObject))
            .map(feedbacks => feedbacks.map(feedback => new Feedback(feedback)));
    }
}