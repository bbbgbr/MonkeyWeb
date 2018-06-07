// var Rx = require('rxjs/Rx');
var _ = require('lodash');

module.exports = function (app, db, post, gradeBitToString) {

    var quarterDB = db.collection('quarter');
    var studentHybridDB = db.collection('hybridStudent');
    var courseDB = db.collection('course');
    var userDB = db.collection('user');
    var configDB = db.collection('config');

    /**
     * Post method for getting room info
     * req.body = {
     *      year 2017,
     *      quarter: 4
     * }
     * if not error
     * res.body = {
     *      sat8: {
     *          room0: {
     *              course: [
     *                  {
     *                      courseID: '2j94jfu3hfeifkf24g4sdfs',
     *                      courseName: 'MS123a',
     *                      num: 10,
     *                      tutorName: Hybrid
     *                  },
     *                  ...
     *              ],
     *              studentCount: 30,
     *              hybrid: [
     *                  {
     *                      hybridID: '49aw7hfj4gawrtf4wgweaf34',
     *                      num: 20
     *                  },
     *                  ...
     *              ]
     *          }
     *      },
     *      ...
     * }
     */
    post('/post/v1/allRoom', function (req, res) {
        var response = {};
        var dayList = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

        configDB.findOne({
            _id: 'config'
        }).then(config => {
            if (req.body.year === undefined || req.body.quarter === undefined) {
                quarter = config.defaultQuarter.quarter.quarter;
                year = config.defaultQuarter.quarter.year
            } else {
                quarter = parseInt(req.body.quarter);
                year = parseInt(req.body.year);
            }
            return quarterDB.findOne({
                quarter: quarter,
                year: year
            })
        }).then(quarter => {
            Promise.all([
                courseDB.aggregate([{
                    $match: {
                        quarter: quarter.quarter,
                        year: quarter.year
                    }
                }, {
                    $unwind: '$student'
                }, {
                    $lookup: {
                        from: 'user',
                        localField: 'student',
                        foreignField: '_id',
                        as: 'student'
                    }
                }, {
                    $unwind: '$tutor'
                }, {
                    $lookup: {
                        from: 'user',
                        localField: 'tutor',
                        foreignField: '_id',
                        as: 'tutor'
                    }
                }, {
                    $group: {
                        _id: '$_id',
                        subject: {
                            $first: '$subject'
                        },
                        grade: {
                            $first: '$grade'
                        },
                        level: {
                            $first: '$level'
                        },
                        day: {
                            $first: '$day'
                        },
                        tutor: {
                            $addToSet: {
                                $arrayElemAt: [
                                    '$tutor', 0
                                ]
                            }
                        },
                        student: {
                            $push: {
                                $arrayElemAt: [
                                    '$student', 0
                                ]
                            }
                        },
                        room: {
                            $first: '$room'
                        }
                    }
                }]).toArray(),
                studentHybridDB.aggregate([{
                    $match: {
                        quarterID: quarter._id
                    }
                }, {
                    $unwind: '$student'
                }, {
                    $lookup: {
                        from: 'user',
                        localField: 'student.studentID',
                        foreignField: '_id',
                        as: 'studentInfo'
                    }
                }, {
                    $group: {
                        _id: '$_id',
                        day: {
                            $first: '$day'
                        },
                        student: {
                            $push: {
                                studentID: '$student.studentID',
                                subject: '$student.subject',
                                registrationState: {
                                    $arrayElemAt: [
                                        '$studentInfo.student.quarter', 0
                                    ]
                                },
                                status: {
                                    $arrayElemAt: [
                                        '$studentInfo.student.status', 0
                                    ]
                                }
                            }
                        }
                    }
                }]).toArray()
            ]).then(values => {
                for (let i = 0; i < values.length; i++) {
                    switch (i) {
                        case 0:
                            for (let j = 0; j < values[i].length; j++) {
                                var date = new Date(values[i][j].day);
                                var field = dayList[date.getDay() % 7] + date.getHours();
                                if (response[field] === undefined) {
                                    response[field] = {};
                                }
                                if (response[field]['room' + values[i][j].room] === undefined) {
                                    response[field]['room' + values[i][j].room] = {};
                                    response[field]['room' + values[i][j].room].course = [];
                                    response[field]['room' + values[i][j].room].studentCount = 0;
                                }

                                var studentNum = _.filter(values[i][j].student, o => {
                                    return _.findIndex(o.student.quarter, {
                                        quarter: quarter.quarter,
                                        year: quarter.year,
                                        registrationState: 'rejected'
                                    }) === -1 && o.student.status === 'active';
                                }).length;
                                response[field]['room' + values[i][j].room].studentCount += studentNum;
                                response[field]['room' + values[i][j].room].maxStudent = quarter.maxSeat[values[i][j].room]
                                response[field]['room' + values[i][j].room].course.push({
                                    courseID: values[i][j]._id,
                                    courseName: values[i][j].subject + gradeBitToString(values[i][j].grade) + values[i][j].level,
                                    num: studentNum,
                                    tutor: values[i][j].tutor[0].nicknameEn
                                });
                            }
                            break;
                        case 1:
                            for (let j = 0; j < values[i].length; j++) {
                                var date = new Date(values[i][j].day);
                                var field = dayList[date.getDay() % 7] + date.getHours();
                                if (response[field] === undefined) {
                                    response[field] = {};
                                }
                                if (response[field]['room0'] === undefined) {
                                    response[field]['room0'] = {};
                                    response[field]['room0'].hybrid = [];
                                    response[field]['room0'].studentCount = 0;
                                } else if (response[field]['room0'].hybrid === undefined) {
                                    response[field]['room0'].hybrid = [];
                                }
                                var studentNum = _.filter(values[i][j].student, o => {
                                    return _.findIndex(o.registrationState, {
                                        quarter: quarter.quarter,
                                        year: quarter.year,
                                        registrationState: 'rejected'
                                    }) === -1 && o.status === 'active';
                                }).length;
                                response[field]['room0'].maxStudent = quarter.maxSeat[0];
                                response[field]['room0'].studentCount += studentNum;
                                response[field]['room0'].hybrid.push({
                                    hybridID: values[i][j]._id,
                                    num: studentNum,
                                    numPhysics: _.filter(values[i][j].student, o => {
                                        return _.findIndex(o.registrationState, {
                                            quarter: quarter.quarter,
                                            year: quarter.year,
                                            registrationState: 'rejected'
                                        }) === -1 && (o.subject === 'P') && o.status === 'active';
                                    }).length,
                                    numMath: _.filter(values[i][j].student, o => {
                                        return _.findIndex(o.registrationState, {
                                            quarter: quarter.quarter,
                                            year: quarter.year,
                                            registrationState: 'rejected'
                                        }) === -1 && o.subject === 'M' && o.status === 'active';
                                    }).length,
                                    numChemistry:  _.filter(values[i][j].student, o => {
                                        return _.findIndex(o.registrationState, {
                                            quarter: quarter.quarter,
                                            year: quarter.year,
                                            registrationState: 'rejected'
                                        }) === -1 && o.subject === 'C' && o.status === 'active';
                                    }).length,
                                    numEnglish:  _.filter(values[i][j].student, o => {
                                        return _.findIndex(o.registrationState, {
                                            quarter: quarter.quarter,
                                            year: quarter.year,
                                            registrationState: 'rejected'
                                        }) === -1 && o.subject === 'E' && o.status === 'active';
                                    }).length,
                                });
                            }
                            break;
                        default:
                            break;
                    }
                }
                res.status(200).send(response);
            });
        });
    });
}