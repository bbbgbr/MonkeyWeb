var ObjectID = require('mongodb').ObjectID;
var schedule = require('node-schedule');

module.exports = function (app, db, post) {

    const MODE_ADD_HYBRID = 1;
    const MODE_REMOVE_HYBRID = 2;

    var quarterDB = db.collection('quarter');
    var studentHybridDB = db.collection('hybridStudent');
    var hybridPendingDB = db.collection('hybridPending');
    var configDB = db.collection('config');

    /**
     * Function for initialize when server start
     * - Add all pending hybrid change request to run function
     */
    hybridPendingDB.find({}).toArray().then(data => {
        console.log('[HYBRID] Load pending hybrid change request');
        console.log('         Remaining request: ' + data.length);
        for (let i = 0; i < data.length; i++) {
            modifyHybridOnTime(data[i]._id, data[i].date, data[i].hybridID, data[i].studentID, data[i].subject, data[i].mode);
        }
    });

    /**
     * Post method for adding hybrid day to quarter
     * req.body = {
     *      quarter: 4
     *      year: 2017
     *      day: 1023004020
     * }
     * 
     * if not error:
     * res.body = 'OK'
     */
    post('/post/v1/addHybridDayToQuarter', function (req, res) {
        if (req.body.quarter === undefined || req.body.year === undefined || req.body.day === undefined) {
            return res.status(400).send({
                err: -1,
                msg: 'Bad Request'
            });
        }
        var reqDate = new Date(parseInt(req.body.day));
        var serverDate = new Date(0);
        serverDate.setHours(reqDate.getHours());
        serverDate.setDate(reqDate.getDate());
        serverDate.setMonth(reqDate.getMonth());
        serverDate.setFullYear(reqDate.getFullYear());
        quarterDB.findOne({
            year: parseInt(req.body.year),
            quarter: parseInt(req.body.quarter)
        }).then(data => {
            studentHybridDB.insertOne({
                quarterID: data._id,
                day: serverDate.getTime(),
                student: []
            }, function (err, result) {
                if (err) {
                    switch (err.code) {
                        case 11000:
                            return res.status(501).send({
                                err: 'Data already exist',
                                msg: err.msg
                            });
                        default:
                            return res.status(500).send({
                                err: -1,
                                msg: 'Internal Server Error'
                            });
                    }
                }
                res.status(200).send('OK');
            });
        });
    });

    /**
     * Post method for listing all hybrid in quarter
     * req.body = {
     *      quarter: 4
     *      year: 2017
     * }
     * if not error
     * res.body = [
     *      day: 34320000
     *      hybridID: 49fjf8weijrfsfs4
     * ]
     */
    post('/post/v1/listHybridDayInQuarter', function (req, res) {
        if (req.body.quarter === undefined || req.body.year === undefined) {
            return res.status(400).send({
                err: -1,
                msg: 'Bad Request'
            });
        }
        quarterDB.findOne({
            year: parseInt(req.body.year),
            quarter: parseInt(req.body.quarter)
        }).then(data => {
            studentHybridDB.find({
                quarterID: data._id
            }).toArray(function (err, result) {
                if (err) {
                    res.status(500).send({
                        err: 0,
                        msg: 'Internal server error'
                    });
                }
                for (let i = 0; i < result.length; i++) {
                    result[i].hybridID = result[i]._id;
                    delete result[i]._id;
                    delete result[i].quarterID
                    delete result[i].student
                }
                res.status(200).send(result);
            });
        });
    });

    /**
     * Post method for adding student to hybrid day
     * req.body = {
     *      hybridID: miagjngoajew934jr3432e3
     *      studentID: 15999
     *      subject: 'M'
     * }
     * if not error
     * res.body = 'OK'
     */
    post('/post/v1/addHybridStudent', function (req, res) {
        if (req.body.hybridID === undefined || req.body.studentID === undefined || req.body.subject === undefined) {
            return res.status(400).send({
                err: -1,
                msg: 'Bad Request'
            });
        }
        studentHybridDB.update({
            _id: ObjectID(req.body.hybridID)
        }, {
            $push: {
                student: {
                    studentID: parseInt(req.body.studentID),
                    subject: req.body.subject
                }
            }
        });
        res.status(200).send('OK')
    });

    /**
     * Post method for remove student from hybrid day
     * req.body = {
     *      hybridID: miagjngoajew934jr3432e3
     *      studentID: 15999
     * }
     * if not error
     * res.body = 'OK'
     */
    post('/post/v1/removeHybridStudent', function (req, res) {
        if (req.body.hybridID === undefined || req.body.studentID === undefined) {
            return res.status(400).send({
                err: -1,
                msg: 'Bad Request'
            });
        }
        studentHybridDB.update({
            _id: ObjectID(req.body.hybridID)
        }, {
            $pull: {
                student: {
                    studentID: parseInt(req.body.studentID)
                }
            }
        });
        res.status(200).send('OK')
    });

    /**
     * Post method for list time of student in hybrid day
     * req.body = {
     *      studentID: 15999
     *      quarter: 4
     *      year: 2017
     * }
     * if not error
     * res.body = [
     *      {
     *          day: 43959400000
     *          hybridID: 'kiq034krmif035g'
     *      }, 
     *      ...
     * ]
     */
    post('/post/v1/listStudentHybrid', function (req, res) {
        if (req.body.studentID === undefined || req.body.quarter === undefined || req.body.year === undefined) {
            return res.status(400).send({
                err: -1,
                msg: 'Bad Request'
            });
        }
        quarterDB.findOne({
            year: parseInt(req.body.year),
            quarter: parseInt(req.body.quarter)
        }).then(data => {
            studentHybridDB.find({
                student: {
                    $elemMatch: {
                        studentID: parseInt(req.body.studentID)
                    }
                },
                quarterID: data._id
            }).toArray(function (err, result) {
                if (err) {
                    switch (err.code) {
                        case 11000:
                            return res.status(501).send({
                                err: 'Data aready exist',
                                msg: err.msg
                            });
                        default:
                            return res.status(500).send({
                                err: -1,
                                msg: 'Internal Server Error'
                            });
                    }
                }
                for (let i = 0; i < result.length; i++) {
                    result[i].hybridID = result[i]._id;
                    for (let j = 0; j < result[i].student.length; j++) {
                        if (result[i].student[j].studentID === parseInt(req.body.studentID)) {
                            result[i].subject = result[i].student[j].subject;
                        }
                    }
                    delete result[i]._id;
                    delete result[i].student;
                    delete result[i].quarterID;
                }
                res.status(200).send(result);
            });
        });
    });

    // write by TAO temp
    post('/post/v1/studentHybridSubject', function (req, res) {
        if (req.body.studentID === undefined || req.body.hybridID === undefined) {
            return res.status(400).send({
                err: -1,
                msg: 'Bad Request'
            });
        }
        studentHybridDB.findOne({
            _id: ObjectID(req.body.hybridID),
        }).then((data) => {
            let result = {};
            result.hybridID = data._id;
            for (let i in data.student) {
                if (data.student[i].studentID === parseInt(req.body.studentID)) {
                    result.studentID = data.student[i].studentID;
                    result.subject = data.student[i].subject
                }
            }
            res.status(200).send(result);
        });
    });

    /**
     * Post method for adding student to hybrid day on specific time
     * req.body = {
     *      hybridID: miagjngoajew934jr3432e3,
     *      studentID: 15999,
     *      subject: 'M',
     *      date: 91542545454
     * }
     * if not error
     * res.body = 'OK'
     */
    post('/post/v1/addHybridStudentOnTime', function (req, res) {
        if (req.body.hybridID === undefined || req.body.studentID === undefined || req.body.subject === undefined || req.body.date === undefined) {
            return res.status(400).send({
                err: -1,
                msg: 'Bad Request'
            });
        }
        hybridPendingDB.insertOne({
            hybridID: req.body.hybridID,
            studentID: req.body.studentID,
            date: req.body.date,
            subject: req.body.subject,
            mode: MODE_ADD_HYBRID
        }, function (err, response) {
            modifyHybridOnTime(response.insertedId, req.body.date, req.body.hybridID, req.body.studentID, req.body.subject, MODE_ADD_HYBRID);
        });
        res.status(200).send('OK')
    });

    /**
     * Post method for remove student from hybrid day on specific time
     * req.body = {
     *      hybridID: miagjngoajew934jr3432e3
     *      studentID: 15999
     * }
     * if not error
     * res.body = 'OK'
     */
    post('/post/v1/removeHybridStudentOnTime', function (req, res) {
        if (req.body.hybridID === undefined || req.body.studentID === undefined || req.body.date === undefined) {
            return res.status(400).send({
                err: -1,
                msg: 'Bad Request'
            });
        }
        hybridPendingDB.insertOne({
            hybridID: req.body.hybridID,
            studentID: req.body.studentID,
            date: req.body.date,
            mode: MODE_REMOVE_HYBRID
        }, function (err, response) {
            modifyHybridOnTime(response.insertedId, req.body.date, req.body.hybridID, req.body.studentID, '', MODE_REMOVE_HYBRID);
        });
        res.status(200).send('OK')
    });

    /**
     * Post method for list time of student in hybrid day
     * req.body = {}
     * if not error
     * res.body = [
     *      {
     *          pendingID: ,am-4wf9fk4wrfw4hoef8v4iwr
     *          day: 43959400000
     *          hybridID: 'kiq034krmif035g'
     *          studentID: '15999',
     *          mode: 'MODE_ADD_HYBRID'
     *      }, 
     *      ...
     * ]
     */
    post('/post/v1/listPendingHybridStudent', function (req, res) {
        hybridPendingDB.find({}).toArray().then(data => {
            for (let i = 0; i < data.length; i++) {
                data[i].pendingID = data[i]._id;
                data[i].mode = data[i].mode === MODE_ADD_HYBRID ? 'MODE_ADD_HYBRID' : 'MODE_REMOVE_HYBRID'
                delete data[i]._id;
            }
            res.status(200).send(data);
        });
    });

    post('/post/v1/checkStudentHybrid', function (req, res) {
        if (!(req.body.studentID && req.body.subject)) {
            return res.status(400).send({
                err: -1,
                msg: 'Bad Request'
            });
        }
        configDB.findOne({
            _id: 'config'
        }).then(config => {
            var quarter, year;
            if (req.body.quarter && req.body.year) {
                quarter = parseInt(req.body.quarter);
                year = parseInt(req.body.year);
            } else {
                quarter = config.defaultQuarter.quarter.quarter;
                year = config.defaultQuarter.quarter.year;
            }
            var quarterID = year + ((('' + quarter).length == 1) ? '0' + quarter : quarter);
            studentHybridDB.find({
                quarterID: quarterID,
                student: {
                    $elemMatch: {
                        studentID: parseInt(req.body.studentID),
                        subject: req.body.subject
                    }
                }
            }).toArray().then(data => {
                if (data.length == 0) {
                    return res.status(200).send({
                        hasHybrid: false
                    });
                } else {
                    return res.status(200).send({
                        hasHybrid: true
                    });
                }
            })
        });
    });

    post('/post/v1/listHybridInfo', function (req, res) {
        if (!req.body.hybridID) {
            return res.status(400).send({
                err: -1,
                msg: 'Bad Request'
            });
        }
        studentHybridDB.findOne({
            _id: ObjectID(req.body.hybridID)
        }).then((data) => {
            res.status(200).send(data)
        });
    });

    /**
     * Function which execute when the input time is reached 
     * Execute method has 2 mode add and remove selected by MODE_ADD_HYBRID, MODE_REMOVE_HYBRID
     * @param {String} id ID of pending object
     * @param {*} date For function to be execute
     * @param {*} hybridID To be add or remove by selected mode
     * @param {*} studentID To be modify
     * @param {*} subject To be added
     * @param {*} mode Select whether add or remove
     */
    function modifyHybridOnTime(id, date, hybridID, studentID, subject, mode) {
        var executeDate = new Date(parseInt(date));
        var executeFunction;
        switch (mode) {
            case MODE_ADD_HYBRID:
                executeFunction = () => studentHybridDB.update({
                    _id: ObjectID(hybridID)
                }, {
                    $push: {
                        student: {
                            studentID: parseInt(studentID),
                            subject: subject
                        }
                    }
                });
                break;
            case MODE_REMOVE_HYBRID:
                executeFunction = () => studentHybridDB.update({
                    _id: ObjectID(hybridID)
                }, {
                    $pull: {
                        student: {
                            studentID: parseInt(studentID)
                        }
                    }
                });
                break;
        }
        console.log('[HYBRID] Request created, Ref_id = ' + id);
        var executeJob = schedule.scheduleJob(executeDate, function () {
            console.log('[HYBRID] Request execute, Ref_id = ' + id);
            executeFunction();
            hybridPendingDB.deleteOne({
                _id: ObjectID(id)
            });
        });
    }
}