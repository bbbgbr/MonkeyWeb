module.exports = function (app, db, post) {
    var ObjectID = require('mongodb').ObjectID;
    var tutorCheckHistoryDB = db.collection('tutorCheckHistory');
    var tutorCheckPendingDB = db.collection('tutorCheckPending');
    var tutorCheckIntervalDB = db.collection('tutorCheckInterval');
    var tutorCheckExtraDB = db.collection('tutorCheckExtra');
    var userDB = db.collection('user');
    var schedule = require('node-schedule');

    var timeRangeStart = [8, 10, 13, 15, 17, 19];
    var timeRangeEnd = [8, 10, 12, 15, 17, 19];
    var description = [{
        name: '-',
        point: 0
    }, {
        name: 'Hybrid',
        point: 2
    }, {
        name: 'Admin',
        point: 1.5
    }, {
        name: 'Sheet',
        point: 1
    }, {
        name: 'Com',
        point: 2
    }, {
        name: 'Reading',
        point: 0
    }, {
        name: 'Course',
        point: 0
    }];

    /**
     * Function to clear pending check in which will be execute at midnight
     */
    var clearTutorCheckPendingOnMidNight = schedule.scheduleJob('0 0 * * *', function () {
        console.log('[TUTOR] Check pending watcher execute');
        tutorCheckPendingDB.find({}).toArray().then(pendingList => {
            for (let i = 0; i < pendingList.length; i++) {
                tutorCheckHistoryDB.insertOne({
                    tutorID: pendingList[i]._id,
                    checkIn: pendingList[i].checkIn,
                    checkOut: new Date(),
                    detail: [-1, -1, -1, -1, -1, -1]
                });
                tutorCheckPendingDB.remove({
                    _id: pendingList[i]._id
                });
                console.log('[TUTOR] User ' + pendingList[i]._id + 'was removed from pending list');
            }
        });
    });

    /**
     * Method for checking request ip address if the request send from local network
     * @param {request} req request information containing ip address
     */
    function isLocal(req) {
        var index = req.ip.match(/\d/);
        var ipAddress = req.ip.substring(index.index, req.ip.length);
        if (ipAddress.substring(0, 7) === '192.168' || ipAddress === '125.25.54.23') {
            return false;
        }
        return true;
    }

    /**
     * Method for tutor to check in
     * req.body = {
     *      tutorID: 99000
     * }
     * 
     * status 401:
     *  If not request in local network
     * res.body = {
     *      err: 0,
     *      msg: 'Unauthorize network'
     * }
     * 
     * status 200:
     *  If check in successfully execute
     * res.body = {
     *      msg: 'OK',
     *      timestamp: new Date()
     * }
     * 
     * status 201:
     *  If already check in
     * res.body = {
     *      msg: 'OK',
     *      timestamp: new Date()
     * }
     */
    post('/post/v1/tutorCheckIn', function (req, res) {
        if (!req.body.tutorID) {
            return res.status(400).send({
                err: -1,
                msg: 'Bad Request'
            });
        }
        if (isLocal(req)) {
            return res.status(401).send({
                err: 0,
                msg: 'Unauthorize network'
            });
        }
        var checkInDate = new Date();
        tutorCheckPendingDB.insertOne({
            _id: parseInt(req.body.tutorID),
            checkIn: checkInDate
        }, function (err, result) {
            if (err) {
                return res.status(202).send({
                    err: err
                });
            }
            res.status(201).send({
                msg: 'OK',
                timestamp: checkInDate
            });
        });
    });

    /**
     * Method for get pending check in of specific tutor
     * req.body = {
     *      tutorID: 99000
     * }
     * 
     * status 401:
     *  If not request in local network
     * res.body = {
     *      err: 0,
     *      msg: 'Unauthorize network'
     * }
     * 
     * status 404:
     *  If not request in local network
     * res.body = {
     *      err: 404,
     *      msg: 'Not Found'
     * }
     * 
     * status 200:
     *   If check in history found
     * res.body = {
     *      checkIn: 2017-11-11T03:41:36.261Z
     * }
     */
    post('/post/v1/getPendingTutorCheckIn', function (req, res) {
        if (!req.body.tutorID) {
            return res.status(400).send({
                err: -1,
                msg: 'Bad Request'
            });
        }
        if (isLocal(req)) {
            return res.status(401).send({
                err: 0,
                msg: 'Unauthorize network'
            });
        }

        tutorCheckPendingDB.findOne({
            _id: parseInt(req.body.tutorID)
        }).then(data => {
            if (!data) {
                return res.status(404).send({
                    err: 404,
                    msg: 'Not Found'
                });
            }
            delete data._id;
            res.status(200).send(data);
        });
    });

    /**
     * Method for get all pending check in of tutor
     * req.body = {
     * }
     * 
     * status 401:
     *  If not request in local network
     * res.body = {
     *      err: 0,
     *      msg: 'Unauthorize network'
     * }
     * 
     * status 404:
     *  If not request in local network
     * res.body = {
     *      err: 404,
     *      msg: 'Not Found'
     * }
     * 
     * status 200:
     * res.body = [
     *      tutorID: 99000
     *      checkIn: 2017-11-11T03:41:36.261Z
     * ]
     */
    post('/post/v1/listPendingTutorCheckIn', function (req, res) {
        tutorCheckPendingDB.find({}).toArray().then(result => {
            for (let i = 0; i < result.length; i++) {
                result[i].tutorID = result[i]._id;
                delete result[i]._id
            }
            res.status(200).send(result);
        });
    });

    /**
     * Method for tutor to check in
     * req.body = {
     *      tutorID: 99000,
     *      slot0: 0,
     *      slot1: 0,
     *      slot2: 0,
     *      slot3: 0,
     *      slot4: 0,
     *      slot5: 0
     * }
     * 
     * status 401:
     *  If not request in local network
     * res.body = {
     *      err: 0,
     *      msg: 'Unauthorize network'
     * }
     * 
     * status 404:
     *   If no check in history found
     * res.body = {
     *      err: 404,
     *      msg: 'No check in history found'
     * }
     * 
     * status 200:
     * res.body = {
     *      msg: 'OK'
     * }
     */
    post('/post/v1/tutorCheckOut', function (req, res) {
        if (!req.body.tutorID || !req.body.slot0 || !req.body.slot1 || !req.body.slot2 || !req.body.slot3 || !req.body.slot4 || !req.body.slot5) {
            return res.status(400).send({
                err: -1,
                msg: 'Bad Request'
            });
        }
        if (isLocal(req)) {
            return res.status(401).send({
                err: 0,
                msg: 'Unauthorize network'
            });
        }

        var slot = [parseInt(req.body.slot0),
            parseInt(req.body.slot1),
            parseInt(req.body.slot2),
            parseInt(req.body.slot3),
            parseInt(req.body.slot4),
            parseInt(req.body.slot5)
        ];

        tutorCheckPendingDB.findOne({
            _id: parseInt(req.body.tutorID)
        }).then(data => {
            if (data == null) {
                return res.status(404).send({
                    err: 404,
                    msg: 'No check in history found'
                });
            }
            tutorCheckHistoryDB.insertOne({
                tutorID: data._id,
                checkIn: data.checkIn,
                checkOut: new Date(),
                detail: slot
            }, function (err, result) {
                if (err) {
                    return res.status(202).send(err);
                }
                res.status(200).send({
                    msg: 'OK'
                });
            });
            tutorCheckPendingDB.remove({
                _id: parseInt(req.body.tutorID)
            })
        });
    });

    /**
     * Method for edit checkout history
     * 
     * req.body = {
     *      historyID: 3j9w8tghq4n394tfunvt49h,
     *      checkIn: 37413400000,
     *      checkOut: 32642340000,
     *      slot: [
     *          1,2,1,4,2,3
     *      ]
     * }
     * 
     * res.body = 'OK'
     */
    post('/post/v1/editCheckOutHistory', function (req, res) {
        if (!(req.body.historyID && (req.body.checkIn || req.body.checkOut || req.body.slot))) {
            return res.status(400).send({
                err: -1,
                msg: 'Bad Request'
            });
        }
        var newValue = {
            $set: {}
        };

        if (req.body.checkIn) {
            newValue.$set.checkIn = new Date(parseInt(req.body.checkIn));
        }
        if (req.body.checkOut) {
            newValue.$set.checkOut = new Date(parseInt(req.body.checkOut));
        }
        if (req.body.slot) {
            newValue.$set.detail = req.body.slot.map(Number);
        }

        tutorCheckHistoryDB.updateOne({
            _id: ObjectID(req.body.historyID)
        }, newValue, (err, db) => {
            if (err) {
                return res.status(400).send(err);
            }
            res.status(200).send('OK');
        });
    });

    /**
     * Method for delete checkout history
     * 
     * req.body = {
     *      historyID: 3j9w8tghq4n394tfunvt49h
     * }
     * 
     * res.body = 'OK'
     */
    post('/post/v1/deleteCheckOutHistory', function (req, res) {
        if (!req.body.historyID) {
            return res.status(400).send({
                err: -1,
                msg: 'Bad Request'
            });
        }

        tutorCheckHistoryDB.deleteOne({
            _id: ObjectID(req.body.historyID)
        }, (err, result) => {
            if (err) {
                return res.status(400).send(err);
            }
            res.status(200).send('OK');
        });
    });

    /**
     * Method for add checkout history
     * 
     * req.body = {
     *      tutorID: 99000,
     *      checkIn: 37413400000,
     *      checkOut: 32642340000,
     *      slot: [
     *          1,2,1,4,2,3
     *      ]
     * }
     * 
     * res.body = 'OK'
     */
    post('/post/v1/addCheckOutHistory', function (req, res) {
        if (!(req.body.tutorID && req.body.checkIn && req.body.checkOut && req.body.slot)) {
            return res.status(400).send({
                err: -1,
                msg: 'Bad Request'
            });
        }
        var slot = req.body.slot.map(Number);
        tutorCheckHistoryDB.insertOne({
            tutorID: parseInt(req.body.tutorID),
            checkIn: new Date(parseInt(req.body.checkIn)),
            checkOut: new Date(parseInt(req.body.checkOut)),
            detail: slot
        }, (err, db) => {
            if (err) {
                return res.status(400).send(err);
            }
            res.status(200).send('OK');
        });
    });

    /**
     * Method for listing check in history
     * 
     * case 1:
     *  List by person
     * req.body = {
     *      tutorID: 99000,
     *      startDate: 13020100000,
     *      endDate: 142003000000,
     * }
     * 
     * res.body = {
     *      detail: [
     *          {
     *              checkIn: 1510976682728,
     *              checkOut: 1510986065378,
     *              detail: [
     *                  '-', 'Admin', 'Com', '-', '-', '-'
     *              ],
     *              historyID: 5a0fd1516885947e13a34d72
     *              sum: 3.4234235143
     *          },
     *          ...
     *      ],
     *      totalSum: 231.425452343
     * }
     * 
     * case 2:
     *  List persent person in day
     * req.body = {
     *      date: 13743000000
     * }
     * 
     * res.body = [
     *      {
     *          checkIn: 1510976682728,
     *          checkOut: 1510986065378,
     *          detail: [
     *              '-', 'Admin', 'Com', '-', '-', '-'
     *          ],
     *          historyID: 5a0fd1516885947e13a34d72
     *          sum: 3.4234235143
     *      },
     *      ...
     *  ]
     */
    post('/post/v1/listCheckInHistory', function (req, res) {
        if (!((req.body.tutorID && req.body.startDate && req.body.endDate) || (req.body.date))) {
            return res.status(400).send({
                err: -1,
                msg: 'Bad Request'
            });
        }
        if (req.body.tutorID && req.body.startDate && req.body.endDate) {
            calculateTutorCredit(req.body.tutorID, req.body.startDate, req.body.endDate).then(response => {
                return res.status(200).send(response);
            });
        } else if (req.body.date) {
            var requestDate = new Date(parseInt(req.body.date));
            var startQueryDate = new Date(requestDate.getFullYear(), requestDate.getMonth(), requestDate.getDate());
            var endQueryDate = new Date(requestDate.getFullYear(), requestDate.getMonth(), requestDate.getDate() + 1);
            var querySlot = 'detail.' + timeRangeStart.indexOf(requestDate.getHours());
            var queryObject = {
                checkIn: {
                    $gte: startQueryDate,
                    $lt: endQueryDate
                }
            }
            queryObject[querySlot] = {
                $ne: -1
            };
            tutorCheckHistoryDB.find(queryObject, {
                sort: {
                    checkIn: -1
                }
            }).toArray().then(result => {
                result.reverse();
                for (let i = 0; i < result.length; i++) {
                    result[i].historyID = result[i]._id;
                    result[i].checkIn = new Date(result[i].checkIn).valueOf();
                    result[i].checkOut = new Date(result[i].checkOut).valueOf();
                    for (let j = 0; j < result[i].detail.length; j++) {
                        result[i].detail[j] = description[result[i].detail[j] + 1].name;
                    }
                    delete result[i]._id;
                }
                return res.status(200).send(result);
            });
        }
    });

    post('/post/v1/listAllCheckInHistory', function (req, res) {
        if (!(req.body.startDate && req.body.endDate)) {
            return res.status(400).send({
                err: -1,
                msg: 'Bad Request'
            });
        }

        tutorCheckHistoryDB.distinct('tutorID').then(ids => {
            ids = ids.sort().filter(x => x !== null);
            return Promise.all(ids.map(id => {
                return calculateTutorCredit(id, req.body.startDate, req.body.endDate);
            }));
        }).then(values => {
            tutorCheckHistoryDB.distinct('tutorID').then(ids => {
                ids = ids.sort().filter(x => x !== null);
                var responseObject = {};
                for (let i = 0; i < ids.length; i++) {
                    responseObject[ids[i]] = values[i];
                }
                res.status(200).send(responseObject);
            });
        });
        // tutorCheckHistoryDB.find({
        //     checkIn: {
        //         $gte: new Date(parseInt(req.body.startDate)),
        //         $lte: new Date(parseInt(req.body.endDate))
        //     }
        // }, {
        //     sort: {
        //         checkIn: -1
        //     }
        // }).toArray().then(result => {
        //     result.reverse();
        //     var totalSum = 0;
        //     var response = {};
        //     for (let i = 0; i < result.length; i++) {
        //         if (response[result[i].tutorID] === undefined) {
        //             response[result[i].tutorID] = {};
        //             response[result[i].tutorID].detail = {};
        //             response[result[i].tutorID].detail.summary = [0, 0, 0, 0, 0, 0, 0];
        //             response[result[i].tutorID].detail.hour = [0, 0, 0, 0, 0, 0, 0];
        //             response[result[i].tutorID].body = [];
        //             response[result[i].tutorID].totalSum = 0;
        //             response[result[i].tutorID].hourSum = 0;
        //         }
        //         var checkInDate = new Date(result[i].checkIn);
        //         var checkOutDate = new Date(result[i].checkOut);
        //         response[result[i].tutorID].hourSum = response[result[i].tutorID].hourSum + ((checkOutDate.getTime() - checkInDate.getTime()) / 3600000);
        //         var dateDetail = {
        //             historyID: result[i]._id,
        //             checkIn: checkInDate.valueOf(),
        //             checkOut: checkOutDate.valueOf(),
        //             detail: [],
        //             sum: 0
        //         };
        //         var checkInSlot = getSlotFromHour(checkInDate.getHours());
        //         var checkOutSlot = getSlotFromHour(checkOutDate.getHours());
        //         if (checkInDate.getHours() <= 8) {
        //             checkInDate.setHours(8);
        //             checkInDate.setMinutes(0);
        //             checkInDate.setSeconds(0);
        //             checkInDate.setMilliseconds(0);
        //         }
        //         if (checkInDate.getHours() === 12) {
        //             checkInDate.setHours(13);
        //             checkInDate.setMinutes(0);
        //             checkInDate.setSeconds(0);
        //             checkInDate.setMilliseconds(0);
        //         }
        //         if (checkInDate.getHours() >= 19) {
        //             checkInDate.setHours(19);
        //             checkInDate.setMinutes(0);
        //             checkInDate.setSeconds(0);
        //             checkInDate.setMilliseconds(0);
        //         }
        //         if (checkOutDate.getHours() <= 8) {
        //             checkOutDate.setHours(8);
        //             checkOutDate.setMinutes(0);
        //             checkOutDate.setSeconds(0);
        //             checkOutDate.setMilliseconds(0);
        //         }
        //         if (checkOutDate.getHours() === 13) {
        //             checkOutDate.setHours(12);
        //             checkOutDate.setMinutes(0);
        //             checkOutDate.setSeconds(0);
        //             checkOutDate.setMilliseconds(0);
        //         }
        //         if (checkOutDate.getHours() >= 19) {
        //             checkOutDate.setHours(19);
        //             checkOutDate.setMinutes(0);
        //             checkOutDate.setSeconds(0);
        //             checkOutDate.setMilliseconds(0);
        //         }
        //         for (let j = 0; j < result[i].detail.length; j++) {
        //             dateDetail.detail.push(description[result[i].detail[j] + 1].name);
        //             if (j === checkInSlot && j === checkOutSlot) {
        //                 // dateDetail.debug.push({
        //                 //     type: 0,
        //                 //     checkInMilli: checkInDate.getTime(),
        //                 //     checkinHour: checkInDate.getHours(),
        //                 //     checkinMin: checkInDate.getMinutes(),
        //                 //     checkOutMilli: checkOutDate.getTime(),
        //                 //     checkOutHour: checkOutDate.getHours(),
        //                 //     checkOutMin: checkOutDate.getMinutes(),
        //                 //     milliDiff: checkOutDate.getTime() - checkInDate.getTime(),
        //                 //     hourDiff: (checkOutDate.getTime() - checkInDate.getTime()) / 7200000,
        //                 //     point: description[result[i].detail[j] + 1].point,
        //                 //     multiply: (checkOutDate.getTime() - checkInDate.getTime()) / 7200000 * description[result[i].detail[j] + 1].point
        //                 // });
        //                 response[result[i].tutorID].detail.summary[result[i].detail[j] + 1] = response[result[i].tutorID].detail.summary[result[i].detail[j] + 1] + (checkOutDate.getTime() - checkInDate.getTime()) / 7200000 * description[result[i].detail[j] + 1].point;
        //                 response[result[i].tutorID].detail.hour[result[i].detail[j] + 1] = response[result[i].tutorID].detail.hour[result[i].detail[j] + 1] + (checkOutDate.getTime() - checkInDate.getTime()) / 7200000;
        //                 dateDetail.sum = dateDetail.sum + (checkOutDate.getTime() - checkInDate.getTime()) / 7200000 * description[result[i].detail[j] + 1].point;
        //             } else if (j === checkInSlot) {
        //                 var date = new Date(checkInDate);
        //                 var hour = [10, 12, 15, 17, 19, 19];
        //                 date.setHours(hour[j]);
        //                 date.setMinutes(0);
        //                 date.setSeconds(0);
        //                 date.setMilliseconds(0);
        //                 // dateDetail.debug.push({
        //                 //     type: 1,
        //                 //     checkInMilli: checkInDate.getTime(),
        //                 //     checkinHour: checkInDate.getHours(),
        //                 //     checkinMin: checkInDate.getMinutes(),
        //                 //     checkOutMilli: date.getTime(),
        //                 //     checkOutHour: date.getHours(),
        //                 //     checkOutMin: date.getMinutes(),
        //                 //     milliDiff: date.getTime() - checkInDate.getTime(),
        //                 //     hourDiff: (date.getTime() - checkInDate.getTime()) / 7200000,
        //                 //     point: description[result[i].detail[j] + 1].point,
        //                 //     multiply: (date.getTime() - checkInDate.getTime()) / 7200000 * description[result[i].detail[j] + 1].point
        //                 // });
        //                 response[result[i].tutorID].detail.summary[result[i].detail[j] + 1] = response[result[i].tutorID].detail.summary[result[i].detail[j] + 1] + (date.getTime() - checkInDate.getTime()) / 7200000 * description[result[i].detail[j] + 1].point;
        //                 response[result[i].tutorID].detail.hour[result[i].detail[j] + 1] = response[result[i].tutorID].detail.hour[result[i].detail[j] + 1] + (date.getTime() - checkInDate.getTime()) / 7200000;
        //                 dateDetail.sum = dateDetail.sum + (date.getTime() - checkInDate.getTime()) / 7200000 * description[result[i].detail[j] + 1].point;
        //             } else if (j === checkOutSlot) {
        //                 var date = new Date(checkOutDate);
        //                 var hour = [8, 10, 13, 15, 17, 19];
        //                 date.setHours(timeRangeStart[j]);
        //                 date.setMinutes(0);
        //                 date.setSeconds(0);
        //                 date.setMilliseconds(0);
        //                 // dateDetail.debug.push({
        //                 //     type: 2,
        //                 //     checkInMilli: date.getTime(),
        //                 //     checkinHour: date.getHours(),
        //                 //     checkinMin: date.getMinutes(),
        //                 //     checkOutMilli: checkOutDate.getTime(),
        //                 //     checkOutHour: checkOutDate.getHours(),
        //                 //     checkOutMin: checkOutDate.getMinutes(),
        //                 //     milliDiff: date.getTime() - checkOutDate.getTime(),
        //                 //     hourDiff: (date.getTime() - checkOutDate.getTime()) / 7200000,
        //                 //     point: description[result[i].detail[j] + 1].point,
        //                 //     multiply: (date.getTime() - checkOutDate.getTime()) / 7200000 * description[result[i].detail[j] + 1].point
        //                 // });
        //                 response[result[i].tutorID].detail.summary[result[i].detail[j] + 1] = response[result[i].tutorID].detail.summary[result[i].detail[j] + 1] + (date.getTime() - checkOutDate.getTime()) / 7200000 * description[result[i].detail[j] + 1].point;
        //                 response[result[i].tutorID].detail.hour[result[i].detail[j] + 1] = response[result[i].tutorID].detail.hour[result[i].detail[j] + 1] + (date.getTime() - checkOutDate.getTime()) / 7200000;
        //                 dateDetail.sum = dateDetail.sum + (date.getTime() - checkOutDate.getTime()) / 7200000 * description[result[i].detail[j] + 1].point;
        //             } else if (j > checkInSlot && j < checkOutSlot) {
        //                 // dateDetail.debug.push({
        //                 //     type: 3,
        //                 //     point: description[result[i].detail[j] + 1].point
        //                 // });
        //                 response[result[i].tutorID].detail.summary[result[i].detail[j] + 1] = response[result[i].tutorID].detail.summary[result[i].detail[j] + 1] + description[result[i].detail[j] + 1].point;
        //                 response[result[i].tutorID].detail.hour[result[i].detail[j] + 1] = response[result[i].tutorID].detail.hour[result[i].detail[j] + 1] + 7200000;
        //                 dateDetail.sum = dateDetail.sum + description[result[i].detail[j] + 1].point;
        //             } else {}
        //         }
        //         response[result[i].tutorID].totalSum = response[result[i].tutorID].totalSum + dateDetail.sum;
        //         response[result[i].tutorID].body.push(dateDetail);
        //     }
        //     return res.status(200).send(response);
        // });
    });

    /**
     * Method for create interval to save range of time
     * 
     * req.body = {
     *      startDate: 1434000000,
     *      endDate: 41300040000,
     * }
     * 
     * res.body = 'OK'
     */
    post('/post/v1/addCheckInterval', function (req, res) {
        if (!(req.body.startDate && req.body.endDate)) {
            return res.status(400).send({
                err: -1,
                msg: 'Bad Request'
            });
        }
        tutorCheckIntervalDB.insertOne({
            startDate: new Date(parseInt(req.body.startDate)),
            endDate: new Date(parseInt(req.body.endDate))
        }, result => {
            res.status(200).send('OK');
        });
    });

    /**
     * Method for list all interval
     * 
     * req.body = {
     * }
     * 
     * res.body = {
     *      [
     *          intervalID: n7934ygh329uhf32f32fefewf,
     *          startDate: 423450000000,
     *          endDate: 524535000000
     *      ], ...
     * }
     */
    post('/post/v1/listInterval', function (req, res) {
        tutorCheckIntervalDB.find({}, {
            sort: {
                startDate: -1
            }
        }).toArray().then(result => {
            for (let i = 0; i < result.length; i++) {
                result[i].intervalID = result[i]._id;
                result[i].startDate = new Date(result[i].startDate).valueOf()
                result[i].endDate = new Date(result[i].endDate).valueOf()
                delete result[i]._id;
            }
            res.status(200).send(result);
        });
    });

    /**
     * Method for edit interval object
     * req.body = {
     *      intervalID: ma3894thgna3u4pg4t3,
     *      startDate: 45324300000,
     *      endDate: 235724200000,
     *      multiplier: {
     *          tutorID: 99000,
     *          value:  153
     *      }
     * }
     * 
     * res.body = 'OK'
     */
    post('/post/v1/editInterval', function (req, res) {
        if (!(req.body.intervalID && (req.body.startDate || req.body.endDate || req.body.multiplier))) {
            return res.status(400).send({
                err: -1,
                msg: 'Bad Request'
            });
        }
        var newValue = {
            $set: {}
        };
        tutorCheckIntervalDB.findOne({
            _id: ObjectID(req.body.intervalID)
        }).then(result => {
            if (req.body.startDate) {
                newValue.$set.startDate = new Date(parseInt(req.body.startDate));
            }
            if (req.body.endDate) {
                newValue.$set.endDate = new Date(parseInt(req.body.endDate));
            }
            if (req.body.multiplier) {
                if (!(req.body.multiplier.tutorID && req.body.multiplier.value)) {
                    return res.status(400).send({
                        err: -1,
                        msg: 'Bad Request'
                    });
                }
                newValue.$set.multiplier = result.multiplier
                if (!result.multiplier) {
                    newValue.$set.multiplier = {}
                }
                newValue.$set.multiplier[req.body.multiplier.tutorID] = parseInt(req.body.multiplier.value);
            }
            tutorCheckIntervalDB.updateOne({
                _id: ObjectID(req.body.intervalID)
            }, newValue, (err, db) => {
                if (err) {
                    return res.status(400).send(err);
                }
                res.status(200).send('OK');
            });
        });
    });

    post('/post/v1/deleteInterval', function (req, res) {
        if (!req.body.intervalID) {
            return res.status(400).send({
                err: -1,
                msg: 'Bad Request'
            });
        }
        tutorCheckIntervalDB.deleteOne({
            _id: ObjectID(req.body.intervalID)
        }, (err, result) => {
            if (err) {
                return res.status(400).send(err);
            }
            res.status(200).send('OK');
        });
    });

    post('/post/v1/addIntervalDone', function (req, res) {
        if (!(req.body.intervalID && req.body.userID)) {
            return res.status(400).send({
                err: -1,
                msg: 'Bad Request'
            });
        }
        tutorCheckIntervalDB.findOne({
            _id: ObjectID(req.body.intervalID)
        }).then(result => {
            var newValue = {
                $set: {}
            };
            if (result.done === undefined) {
                newValue.$set.done = [parseInt(req.body.userID)];
            } else {
                newValue.$set.done = result.done;
                newValue.$set.done.push(parseInt(req.body.userID));
            }
            tutorCheckIntervalDB.updateOne({
                _id: ObjectID(req.body.intervalID)
            }, newValue, (err, db) => {
                if (err) {
                    return res.status(400).send(err);
                }
                res.status(200).send('OK');
            });
        });
    });

    post('/post/v1/deleteIntervalDone', function (req, res) {
        if (!(req.body.intervalID && req.body.userID)) {
            return res.status(400).send({
                err: -1,
                msg: 'Bad Request'
            });
        }
        tutorCheckIntervalDB.findOne({
            _id: ObjectID(req.body.intervalID)
        }).then(result => {
            var newValue = {
                $set: {}
            };
            if (result.done === undefined) {
                newValue.$set.done = [];
            } else {
                newValue.$set.done = result.done;
                remove(newValue.$set.done, parseInt(req.body.userID));
            }
            tutorCheckIntervalDB.updateOne({
                _id: ObjectID(req.body.intervalID)
            }, newValue, (err, db) => {
                if (err) {
                    return res.status(400).send(err);
                }
                res.status(200).send('OK');
            });
        });
    });

    /**
     * Method for add extra
     * req.body = {
     *      intervalID: gjhq034bwcav4ht90q34t,
     *      tutorID: 99000,
     *      value: -1123,
     *      reason: 'Hello World'
     * }
     */
    post('/post/v1/addExtra', function (req, res) {
        if (!(req.body.intervalID && req.body.tutorID && req.body.value && req.body.reason)) {
            return res.status(400).send({
                err: -1,
                msg: 'Bad Request'
            });
        }
        tutorCheckExtraDB.insertOne({
            intervalID: req.body.intervalID,
            tutorID: req.body.tutorID,
            value: parseInt(req.body.value),
            reason: req.body.reason
        }, (err, result) => {
            if (err) {
                return res.status(400).send(err);
            }
            res.status(200).send('OK');
        });
    });

    /**
     * Method for editExtra
     * req.body = {
     *      extraID: rgmeansi4ut0hwafiw4g4,
     *      tutorID: 99000
     *      value: 234895,
     *      reason: 'Hello World'
     * }
     */
    post('/post/v1/editExtra', function (req, res) {
        if (!(req.body.extraID && (req.body.tutorID || req.body.value || req.body.reason))) {
            return res.status(400).send({
                err: -1,
                msg: 'Bad Request'
            });
        }
        var newValue = {
            $set: {}
        };
        if (req.body.tutorID) {
            newValue.$set.tutorID = req.body.tutorID;
        }
        if (req.body.value) {
            newValue.$set.value = parseInt(req.body.value);
        }
        if (req.body.reason) {
            newValue.$set.reason = req.body.reason;
        }
        tutorCheckExtraDB.updateOne({
            _id: ObjectID(req.body.extraID)
        }, newValue, (err, db) => {
            if (err) {
                return res.status(400).send(err);
            }
            res.status(200).send('OK');
        });
    });

    /**
     * Method for remove extra
     * req.body = {
     *      extraID: aeuy4a0hawu3rftw94t4
     * }
     */
    post('/post/v1/removeExtra', function (req, res) {
        if (!req.body.extraID) {
            return res.status(400).send({
                err: -1,
                msg: 'Bad Request'
            });
        }
        tutorCheckExtraDB.deleteOne({
            _id: ObjectID(req.body.extraID)
        }, (err, result) => {
            if (err) {
                return res.status(400).send(err);
            }
            res.status(200).send('OK');
        });
    });

    /**
     * Method for list extra
     * req.body = {
     *      intervalID: tn24u9wnf3g4rr3,
     *      tutorID: 99000
     * }
     */
    post('/post/v1/listExtra', function (req, res) {
        if (!(req.body.intervalID && req.body.tutorID)) {
            return res.status(400).send({
                err: -1,
                msg: 'Bad Request'
            });
        }
        tutorCheckExtraDB.find({
            intervalID: req.body.intervalID,
            tutorID: req.body.tutorID
        }).toArray().then(result => {
            for (let i = 0; i < result.length; i++) {
                result[i].extraID = result[i]._id;
                delete result[i]._id;
            }
            res.status(200).send(result);
        })
    });

    function getSlotFromHour(hour) {
        switch (true) {
            case (hour > 0 && hour < 10):
                return 0;
            case (hour >= 10 && hour < 12):
                return 1;
            case (hour >= 12 && hour < 15):
                return 2;
            case (hour >= 15 && hour < 17):
                return 3;
            case (hour >= 17 && hour < 19):
                return 4;
            case (hour >= 19 || hour === 0):
                return 5;
            default:
                return -1;
        }
    }

    function remove(array, element) {
        var index = array.indexOf(element);
        if (index !== -1) {
            array.splice(index, 1);
        }
    }

    function calculateTutorCredit(tutorID, startDate, endDate) {
        return tutorCheckHistoryDB.find({
            tutorID: parseInt(tutorID),
            checkIn: {
                $gte: new Date(parseInt(startDate)),
                $lte: new Date(parseInt(endDate))
            }
        }, {
            sort: {
                checkIn: -1
            }
        }).toArray().then(result => {
            result.reverse();
            var totalSum = 0;
            var hourSum = 0;
            var response = {};
            response.summary = [0, 0, 0, 0, 0, 0, 0];
            response.hour = [0, 0, 0, 0, 0, 0, 0];
            for (let i = 0; i < result.length; i++) {
                var checkInTime = result[i].checkIn
                result[i].historyID = result[i]._id;
                result[i].checkIn = new Date(result[i].checkIn).valueOf();
                result[i].checkOut = new Date(result[i].checkOut).valueOf();
                var startIndex = -1,
                    endIndex = -1;
                for (let j = 0; j < result[i].detail.length; j++) {
                    if (startIndex == -1 && result[i].detail[j] != -1) startIndex = j;
                    if (endIndex == -1 && result[i].detail[result[i].detail.length - j - 1] != -1) endIndex = result[i].detail.length - j - 1;
                }
                var sum = 0;
                for (let j = 0; j < result[i].detail.length; j++) {
                    if (checkInTime.getHours() >= 19) {
                        result[i].detail[j] = description[result[i].detail[j] + 1].name;
                        continue;
                    }
                    if (j === startIndex && j === endIndex) {
                        var date1 = new Date(result[i].checkIn);
                        var date2 = new Date(result[i].checkOut);
                        if (date1.getHours() < 8) {
                            date1.setHours(8);
                            date1.setMinutes(0);
                            date1.setSeconds(0);
                            date1.setMilliseconds(0);
                        }
                        if (date1.getHours() < 13 && date1.getHours() > 12) {
                            date1.setHours(13);
                            date1.setMinutes(0);
                            date1.setSeconds(0);
                            date1.setMilliseconds(0);
                        }
                        if (date2.getHours() < 13 && date2.getHours() > 12) {
                            date2.setHours(12);
                            date2.setMinutes(0);
                            date2.setSeconds(0);
                            date2.setMilliseconds(0);
                        }
                        if (date2.getHours() > 19) {
                            date2.setHours(19);
                            date2.setMinutes(0);
                            date2.setSeconds(0);
                            date2.setMilliseconds(0);
                        }
                        var diff = date2 - date1;
                        response.summary[result[i].detail[j] + 1] += description[result[i].detail[j] + 1].point * (diff / 7200000);
                        response.hour[result[i].detail[j] + 1] += diff;
                        sum += description[result[i].detail[j] + 1].point * (diff / 7200000);
                    } else if (j === startIndex) {
                        var date1 = new Date(result[i].checkIn);
                        var date2 = new Date(result[i].checkIn);
                        if (date1.getHours() < 8) {
                            date1.setHours(8);
                            date1.setMinutes(0);
                            date1.setSeconds(0);
                            date1.setMilliseconds(0);
                        }
                        if (date1.getHours() < 13 && date1.getHours() > 12) {
                            date1.setHours(13);
                            date1.setMinutes(0);
                            date1.setSeconds(0);
                            date1.setMilliseconds(0);
                        }
                        date2.setHours(timeRangeEnd[startIndex + 1]);
                        date2.setMinutes(0);
                        date2.setSeconds(0);
                        date2.setMilliseconds(0);
                        var diff = date2 - date1;
                        response.summary[result[i].detail[j] + 1] += description[result[i].detail[j] + 1].point * (diff / 7200000);
                        response.hour[result[i].detail[j] + 1] += diff;
                        sum += description[result[i].detail[j] + 1].point * (diff / 7200000);
                    } else if (j === endIndex) {
                        var date1 = new Date(result[i].checkOut);
                        var date2 = new Date(result[i].checkOut);
                        if (date2.getHours() > 19) {
                            date2.setHours(19);
                            date2.setMinutes(0);
                            date2.setSeconds(0);
                            date2.setMilliseconds(0);
                        }
                        if (date2.getHours() < 13 && date2.getHours() > 12) {
                            date2.setHours(12);
                            date2.setMinutes(0);
                            date2.setSeconds(0);
                            date2.setMilliseconds(0);
                        }
                        date1.setHours(timeRangeStart[endIndex]);
                        date1.setMinutes(0);
                        date1.setSeconds(0);
                        date1.setMilliseconds(0);
                        var diff = date2 - date1;
                        response.summary[result[i].detail[j] + 1] += description[result[i].detail[j] + 1].point * (diff / 7200000);
                        response.hour[result[i].detail[j] + 1] += diff;
                        sum += description[result[i].detail[j] + 1].point * (diff / 7200000);
                    } else {
                        response.summary[result[i].detail[j] + 1] += description[result[i].detail[j] + 1].point;
                        sum += description[result[i].detail[j] + 1].point;
                    }
                    result[i].detail[j] = description[result[i].detail[j] + 1].name;
                }
                result[i].sum = sum;
                totalSum += sum;
                hourSum = hourSum + result[i].checkOut - result[i].checkIn;
                delete result[i].tutorID;
                delete result[i]._id;
            }
            response.detail = result;
            response.totalSum = totalSum;
            response.hourSum = (hourSum / 3600000);
            return response;
        });
    }
}