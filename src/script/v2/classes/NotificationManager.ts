import * as mongoose from "mongoose";
import { Document, Schema } from "mongoose";
import { Observable } from "rx";
var OneSignal = require('onesignal-node');

export interface IOSTokenInterface extends Document {
    _id: string,
    device: string,
    userID: number
}

let IOSTokenSchema = new Schema({
    _id: String,
    device: String,
    userID: Number
});

let IOSTokenModel = mongoose.model<IOSTokenInterface>("IOSToken", IOSTokenSchema, "deviceToken");

export class IOSTokenManager {
    static addToken(token: string, userID: number): Observable<IOSToken> {
        let deviceToken = new IOSTokenModel({
            _id: token,
            device: "iOS",
            userID: userID
        });
        return Observable.fromPromise(deviceToken.save())
            .map(iOSToken => new IOSToken(iOSToken));
    }

    static getUserToken(userID: number): Observable<IOSToken[]> {
        return Observable.fromPromise(IOSTokenModel.find({
            userID: userID
        }))
            .map(iOSTokens => iOSTokens.map(iOSToken => new IOSToken(iOSToken)));
    }
}

export class IOSToken {
    private iOSToken: IOSTokenInterface;

    constructor(iOSToken: IOSTokenInterface) {
        this.iOSToken = iOSToken;
    }

    getID(): string {
        return this.iOSToken._id;
    }
}

export class IOSNotificationManager {
    private static _instance: IOSNotificationManager = new IOSNotificationManager();
    private client: any;

    constructor() {
        this.client = new OneSignal.Client({
            userAuthKey: process.env.ONESIGNAL_USER_AUTH,
            app: { appAuthKey: process.env.ONESIGNAL_APP_AUTH, appId: process.env.ONESIGNAL_APP_ID }
        });
    }

    public static getInstance(): IOSNotificationManager {
        return this._instance;
    }

    send(userID: number, msg: string): Observable<any> {
        return IOSTokenManager.getUserToken(userID).flatMap(tokens => {
            let notification = new OneSignal.Notification({
                contents: {
                    en: msg
                },
            });
            notification.setTargetDevices(tokens.map(token => token.getID()));
            notification.setParameter("ios_badgeType", "Increase");
            notification.setParameter("ios_badgeCount", 1);
            return Observable.fromPromise(this.client.sendNotification(notification))
        });
    }
}