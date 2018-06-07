import * as mongoose from "mongoose";
import { Document, Schema } from "mongoose";
import { Observable } from "rx";

interface ConfigInterface extends Document {
    _id: String,
    courseMaterialPath: String,
    receiptPath: String,
    nextStudentID: Number,
    nextTutorID: Number,
    profilePicturePath: String,
    attendanceDocumentPath: String,
    studentSlideshowPath: String,
    studentCommentPicturePath: String,
    defaultQuarter: {
        quarter: {
            year: Number,
            quarter: Number
        },
        summer: {
            year: Number,
            quarter: Number
        },
        registration: {
            year: Number,
            quarter: Number
        }
    },
    documentPath: String,
    allowRegistration: Boolean,
    coursePrice: Number,
    inSummer: Boolean
}

let configSchema = new Schema({
    _id: String,
    courseMaterialPath: String,
    receiptPath: String,
    nextStudentID: Number,
    nextTutorID: Number,
    profilePicturePath: String,
    attendanceDocumentPath: String,
    studentSlideshowPath: String,
    studentCommentPicturePath: String,
    defaultQuarter: {
        quarter: {
            year: Number,
            quarter: Number
        },
        summer: {
            year: Number,
            quarter: Number
        },
        registration: {
            year: Number,
            quarter: Number
        }
    },
    documentPath: String,
    allowRegistration: Boolean,
    coursePrice: Number,
    inSummer: Boolean
});

let configModel = mongoose.model<ConfigInterface>('Config', configSchema, 'config');

class Config {
    private config: ConfigInterface;

    constructor(config: ConfigInterface) {
        this.config = config;
    }

    getDefualtQuarter(): { year: Number, quarter: Number } {
        return this.config.defaultQuarter.quarter
    }

    getDefualtSummer(): { year: Number, quarter: Number } {
        return this.config.defaultQuarter.summer;
    }

    getDefaultRegistrationQuarter(): { year: Number, quarter: Number } {
        return this.config.defaultQuarter.registration;
    }
}

export class ConfigManager {

    static getConfig(): Observable<Config> {
        return Observable.fromPromise(configModel.findById('config'))
            .map(config => new Config(config));
    }

}