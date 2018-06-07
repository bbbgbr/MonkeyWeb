var ObjectID = require("mongodb").ObjectID;
var apn = require('apn');

module.exports = function (app, db, post) {

    var deviceTokenDB = db.collection('deviceToken');

    post('/post/v1/registeriOSDeviceToken', function (req, res) {
        if (!(req.body.id && req.body.token)) {
            res.status(400).send({
                err: 0,
                msg: 'Bad Request'
            });
        }
        deviceTokenDB.update({
            _id: req.body.token
        }, {
            $set: {
                device: 'iOS',
                userID: parseInt(req.body.id)
            }
        }, {
            upsert: true
        }).then(_ => {
            res.status(200).send({
                msg: 'OK'
            });
        });
    });

    post('/post/testNotification', function (req, res) {
        if (!req.body.text) {
            res.status(400).send({
                err: 0,
                msg: 'Bad Request'
            });
        }

        var deviceToken = 'cb788431af48bd800b266691b5d0fce843156f89940d4bade01eddcf3eedf1f3';

        var notification = new apn.Notification();
        notification.topic = 'com.monkey-monkey.tutor';
        notification.expiry = Math.floor(Date.now() / 1000) + 3600;
        notification.badge = 1;
        notification.sound = 'ping.aiff';
        notification.alert = req.body.text;
        notification.payload = {
            id: 123
        };
        apnProvider.send(notification, deviceToken).then(function (result) {
            res.status(200).send(result);
        });
    });

}