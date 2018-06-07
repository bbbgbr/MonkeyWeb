var ObjectID = require('mongodb').ObjectID;
var fs = require('fs-extra');

module.exports = function (app, db, post) {

    var courseDB = db.collection('course');
    var configDB = db.collection('config');
    var studentDocumentDB = db.collection('studentDocument');
    var userDB = db.collection('user');
    var attendanceDocumentDB = db.collection('attendanceDocument');

    /**
     * Post method for upload file to document coresponse to the course
     * req.body = {
     *      courseID: mu0rc23mibg-q4rawrvs (Optional),
     *      displayDate: 1800000000 (Optional)
     * }
     * req.files = [file, ...]
     * 
     * if not error:
     * 
     * res.body = 'OK'
     */
    post('/post/v1/uploadDocument', function (req, res) {
        if (req.files === undefined) {
            return res.status(400).send({
                err: -1,
                msg: 'Bad Request'
            });
        }
        configDB.findOne({
            _id: 'config'
        }).then(config => {
            var files = req.files;
            var error;
            var date;
            if (req.body.displayDate !== undefined) {
                date = new Date(parseInt(req.body.date));
            } else {
                date = new Date();
            }
            var moveFile = (courseID, files, res) => {
                var dir = config.documentPath + courseID;
                try {
                    fs.ensureDirSync(dir);
                } catch (err) {
                    return res.status(500).send({
                        err: err.errno,
                        msg: err
                    });
                }
                for (let i = 0; i < files.length; i++) {
                    var path = config.documentPath.substring(0, config.documentPath.length - 1);
                    try {
                        fs.moveSync(files[i].path, dir + '/' + files[i].originalname);
                        studentDocumentDB.insertOne({
                            name: files[i].originalname.substring(0, files[i].originalname.indexOf('.')),
                            location: path.substring(path.lastIndexOf('/'), path.length) + '/' + config.documentPath.substring(0, config.documentPath.length - 1).substring(config.documentPath.lastIndexOf('/'), config.documentPath.length) + courseID + '/' + files[i].originalname,
                            fileType: files[i].mimetype.substring(files[i].mimetype.indexOf('/') + 1, files[i].mimetype.length),
                            courseID: courseID,
                            upload: new Date(),
                            displayDate: date
                        }, function (err, result) { });
                    } catch (err) {
                        if (error === undefined) {
                            error = [];
                        }
                        error.push(err);
                    }
                }
                if (error) {
                    return res.status(500).send({
                        err: 1,
                        msg: error
                    });
                } else {
                    return res.status(200).send('OK');
                }
            }
            if (req.body.courseID !== undefined) {
                courseDB.findOne({
                    _id: req.body.courseID
                }).then(course => {
                    if (course === null) {
                        return res.status(404).send({
                            err: 0,
                            msg: 'Course not found'
                        });
                    }
                    moveFile(course._id, files, res);
                })
            } else {
                moveFile(config.defaultQuarter.quarter.year + (((('' + config.defaultQuarter.quarter.quarter).length) === 1) ? '0' : '') + config.defaultQuarter.quarter.quarter, files, res);
            }
        });
    });

    /**
     * Post method for listing document in database
     * req.body = {
     *      courseID: mau9fgwa4egv024wreafc (Optional),
     *      studentID: 15999 (Optinal)
     * }
     * 
     * if not error
     * 
     * res.body = [
     *      {
     *          documentID: '24mt0fgbm35-tajr342grabag'
     *          name: 'Filename',
     *          location: '/testUpload/20174/SpringWaltz.pdf'
     *          fileType: 'pdf',
     *          courseID: 'gaenu4ag02wraj2o34wrgb',
     *          upload: '2017-10-21T01:25:52.865Z',
     *          displayDate: '2017-10-21T01:25:52.865Z'
     *      }, ...
     * ]
     */
    post('/post/v1/listDocument', function (req, res) {
        configDB.findOne({
            _id: 'config'
        }).then(config => {
            var quarterDocument = () => studentDocumentDB.find({
                courseID: config.defaultQuarter.quarter.year + (((('' + config.defaultQuarter.quarter.quarter).length) === 1) ? '0' : '') + config.defaultQuarter.quarter.quarter
            }).toArray();

            var courseDocument = (courseID) => studentDocumentDB.find({
                courseID: courseID
            }).toArray();

            if (req.body.courseID === undefined && req.body.studentID === undefined) {
                quarterDocument().then(data => {
                    for (let i = 0; i < data.length; i++) {
                        data[i].documentID = data[i]._id;
                        delete data[i]._id;
                    }
                    return res.status(200).send(data);
                });
            } else if (req.body.courseID !== undefined && req.body.studentID === undefined) {
                courseDocument(req.body.courseID).then(data => {
                    for (let i = 0; i < data.length; i++) {
                        data[i].documentID = data[i]._id;
                        delete data[i]._id;
                    }
                    return res.status(200).send(data);
                });
            } else if (req.body.courseID === undefined && req.body.studentID !== undefined) {
                userDB.findOne({
                    _id: parseInt(req.body.studentID)
                }).then(user => {
                    if (user === undefined) {
                        return res.status(404).send({
                            err: 404,
                            msg: 'User not found'
                        });
                    }
                    return courseDB.find({
                        student: parseInt(req.body.studentID)
                    }).toArray()
                }).then(courses => {
                    var promise = [];
                    promise.push()
                    promise.push(quarterDocument());
                    for (let i = 0; i < courses.length; i++) {
                        promise.push(courseDocument(courses._id));
                    }
                    Promise.all(promise).then(values => {
                        var response = [];
                        for (let i = 0; i < values.length; i++) {
                            for (let j = 0; j < values[i].length; j++) {
                                response.push(values[i][j]);
                            }
                        }
                        for (let i = 0; i < response.length; i++) {
                            response[i].documentID = response[i]._id;
                            delete response[i]._id;
                        }
                        return res.status(200).send(response);
                    });
                });
            } else {
                res.status(200).send([]);
            }
        });
    });

    post('/post/v1/removeDocument', function (req, res) {
        if (req.body.documentID === undefined) {
            return res.status(400).send({
                err: -1,
                msg: 'Bad Request'
            });
        }
        configDB.findOne({
            _id: 'config'
        }).then(config => {
            studentDocumentDB.findOne({
                _id: ObjectID(req.body.documentID)
            }).then(data => {
                if (data == null) {
                    return res.status(404).send({
                        err: 404,
                        msg: 'Document not found'
                    });
                }
                var rootPath = config.documentPath;
                var filePath = data.location;
                filePath = filePath.substring(1, filePath.length);
                rootPath += filePath.substring(filePath.indexOf('/') + 1, filePath.length);
                try {
                    fs.removeSync(rootPath);
                    studentDocumentDB.deleteOne({
                        _id: ObjectID(data._id)
                    });
                } catch (error) {
                    return res.status(404).send({
                        err: 404,
                        msg: 'File not found'
                    });
                }
                res.status(200).send('OK');
            });
        });
    });

    post('/post/v1/uploadAttendanceDocument', function (req, res) {
        if (!(req.body.attendanceID && req.files)) {
            res.status(400).send({
                err: -1,
                msg: 'Bad Request'
            });
        }
        Promise.all([
            attendanceDocumentDB.insertOne({
                attendanceID: req.body.attendanceID
            }),
            configDB.findOne({
                _id: 'config'
            })
        ]).then(values => {
            try {
                fs.ensureDirSync(values[1].attendanceDocumentPath);
                fs.moveSync(req.files[0].path, values[1].attendanceDocumentPath + '/' + values[0].ops[0]._id);
            } catch (e) {
                return res.status(500).send({
                    err: 2,
                    errorInfo: e
                });
            }
            res.status(200).send('OK');
        });
    });

    post('/post/v1/removeAttendanceDocument', function (req, res) {
        if (!req.body.attendanceDocumentID) {
            res.status(400).send({
                err: -1,
                msg: 'Bad Request'
            });
        }
        Promise.all([
            configDB.findOne({
                _id: 'config'
            }),
            attendanceDocumentDB.remove({
                _id: ObjectID(req.body.attendanceDocumentID)
            })
        ]).then(values => {
            try {
                fs.removeSync(values[0].attendanceDocumentPath + '/' + req.body.attendanceDocumentID)
            } catch (error) {
                return res.status(500).send({
                    err: 2,
                    errorInfo: e
                });
            }
            res.status(200).send('OK');
        });
    });

    app.get('/get/v1/attendanceDocument', function (req, res) {
        if (!req.query.k) {
            return res.status(400).send({
                err: 0,
                msg: 'Bad Reqeust'
            });
        }
        configDB.findOne({
            _id: 'config'
        }).then(config => {
            res.sendFile(config.attendanceDocumentPath + '/' + req.query.k);
        });
    });

    post('/post/v1/countAnnouncement', function (req, res) {
        configDB.findOne({
            _id: 'config'
        }).then(config => {
            fs.readdir(config.studentSlideshowPath, function (err, files) {
                if (err) {
                    return res.status(400).send({
                        err: 0,
                        msg: 'Bad Reqeust'
                    });
                }
                return res.status(200).send(files);
            });
        });
    });
}