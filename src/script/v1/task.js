var ObjectID = require("mongodb").ObjectID;
var apn = require('apn');

module.exports = function (app, db, post) {

    var taskDB = db.collection('task');
    var userDB = db.collection('user');
    var deviceTokenDB = db.collection('deviceToken');

    const NONE = -1;
    const TODO = 0;
    const ON_PROCESS = 1;
    const ASSIGN = 2;
    const DONE = 3;
    const COMPLETE = 4;
    try {
        var keyPath = __dirname.substring(0, __dirname.indexOf('script')) + 'key/MonkeyTutorNotification.p8';
        var apnProvider = new apn.Provider({
            token: {
                key: keyPath,
                keyId: 'GPJR9B9WJ6',
                teamId: 'S4F5J66T3H'
            },
            production: false
        });
    } catch (error) {
        console.log('cant find keyPath')
    }

    post('/post/v1/addTask', function (req, res) {
        if (!(req.body.assigner && req.body.title && req.body.detail)) {
            return res.status(400).send({
                err: -1,
                msg: 'Bad Request'
            });
        };

        var task = {
            createOn: new Date(),
            lastModified: new Date(),
            title: req.body.title,
            detail: req.body.detail,
            owner: parseInt(req.body.assigner),
            createBy: parseInt(req.body.assigner),
            modifyBy: parseInt(req.body.assigner),
            ancestors: [],
            parent: null,
            status: TODO,
            order: -1,
            remark: ''
        };

        if (req.body.dueDate) {
            task.dueDate = new Date(parseInt(req.body.dueDate));
            task.hasDueDate = true;
        } else {
            task.hasDueDate = false;
        }

        if (req.body.tags) {
            if (Array.isArray(req.body.tags)) {
                task.tags = req.body.tags;
            } else {
                task.tags = [req.body.tags];
            }
        } else {
            task.tags = [];
        }

        taskDB.insertOne(task, (err, result) => {
            if (err) {
                return res.status(500).send({
                    err: 0,
                    errInfo: err
                });
            }
            res.status(200).send({
                msg: 'OK'
            });
        });
    });

    post('/post/v1/editTask', function (req, res) {
        if (!(req.body.taskID && req.body.modifier && (req.body.title || req.body.detail || req.body.dueDate || req.body.tags))) {
            return res.status(400).send({
                err: -1,
                msg: 'Bad Reqeust'
            });
        }

        var newValue = {
            $set: {
                modifyBy: parseInt(req.body.modifier),
                lastModified: new Date()
            }
        };

        if (req.body.title) {
            newValue.$set.title = req.body.title;
        }
        if (req.body.detail) {
            newValue.$set.detail = req.body.detail;
        }
        if (req.body.dueDate) {
            newValue.$set.dueDate = new Date(parseInt(req.body.dueDate));
        }
        if (req.body.tags) {
            if (Array.isArray(req.body.tags)) {
                newValue.$set.tags = req.body.tags;
            } else {
                newValue.$set.tags = [req.body.tags];
            }
        }

        taskDB.findOne({
            _id: ObjectID(req.body.taskID)
        }).then(task => {
            return taskDB.updateMany({
                ancestors: task.ancestors[0]
            }, newValue);
        }).then((err, result) => {
            res.status(200).send({
                msg: 'OK'
            });
        });
    });

    post('/post/v1/assignTask', function (req, res) {
        if (!(req.body.assigner && req.body.assignees && req.body.taskID)) {
            return res.status(400).send({
                err: -1,
                msg: 'Bad Request'
            });
        }
        var assignees = req.body.assignees;
        if (!Array.isArray(assignees)) {
            assignees = [assignees];
        }

        assignees = assignees.map(assignee => parseInt(assignee));

        taskDB.findOne({
            _id: ObjectID(req.body.taskID)
        }).then(parentTask => {
            var ancestors = parentTask.ancestors;
            ancestors.push(parentTask._id);
            var insertObject = assignees.map(assignee => {
                var temp = {
                    createOn: new Date(),
                    lastModified: new Date(),
                    title: parentTask.title,
                    detail: parentTask.detail,
                    owner: assignee,
                    createBy: parseInt(req.body.assigner),
                    modifyBy: parseInt(req.body.assigner),
                    ancestors: ancestors,
                    parent: parentTask._id,
                    status: TODO,
                    hasDueDate: parentTask.hasDueDate,
                    tags: parentTask.tags,
                    order: -1,
                    remark: ''
                }
                if (parentTask.hasDueDate) {
                    temp.dueDate = parentTask.dueDate;
                }
                return temp;
            });

            return Promise.all([
                taskDB.insertMany(insertObject),
                taskDB.updateOne({
                    _id: ObjectID(req.body.taskID)
                }, {
                    $set: {
                        status: ASSIGN
                    }
                })
            ]);
        }).then(values => {
            return Promise.all([
                userDB.findOne({
                    _id: parseInt(req.body.assigner)
                }),
                deviceTokenDB.find({
                    userID: {
                        $in: req.body.assignees.map(id => parseInt(id))
                    }
                }).toArray()  
            ]);
        }).then(data => {
            return Promise.all(data[1].map(token => {
                var notification = new apn.Notification();
                notification.topic = 'com.monkey-monkey.tutor';
                notification.expiry = Math.floor(Date.now() / 1000) + 86400;
                notification.badge = 1;
                notification.sound = 'ping.aiff';
                notification.alert = data[0].nicknameEn + ' assign you a task.';
                notification.payload = {
                    id: 123
                };
                return apnProvider.send(notification, token._id);
            }));
        }).then(results => {
            res.status(200).send({
                msg: 'OK'
            });
        });
    });

    post('/post/v1/changeTaskStatus', function (req, res) {
        if (!(req.body.taskID && req.body.taskStatus)) {
            return res.status(400).send({
                err: -1,
                msg: 'Bad Request'
            });
        }

        var changeStatus = (task, childStatus) => {
            return Promise.all([
                taskDB.updateOne({
                    _id: ObjectID(task._id)
                }, {
                    $set: {
                        status: childStatus
                    }
                }),
                taskDB.updateOne({
                    _id: ObjectID(task.parent)
                }, {
                    $set: {
                        childStatus: childStatus
                    }
                })
            ])
        }

        taskDB.findOne({
            _id: ObjectID(req.body.taskID)
        }).then(task => {
            if (parseInt(req.body.taskStatus) === DONE) {
                if (task.parent === null) {
                    return taskDB.findOne({
                        _id: ObjectID(task._id)
                    }).then(task => {
                        return taskDB.updateMany({
                            $or: [{
                                ancestors: ObjectID(task._id)
                            }, {
                                _id: task._id
                            }]
                        }, {
                            $set: {
                                status: COMPLETE
                            }
                        });
                    }).catch(err => {
                        throw (err);
                    });
                } else {
                    return taskDB.find({
                        parent: task.parent
                    }).toArray().then(tasks => {
                        var doneTask = tasks.filter(task => task.status === DONE);
                        if (doneTask.length >= tasks.length - 1) {
                            return Promise.all([
                                taskDB.updateMany({
                                    ancestors: ObjectID(task.parent)
                                }, {
                                    $set: {
                                        childStatus: DONE
                                    }
                                }),
                                taskDB.updateOne({
                                    _id: task._id
                                }, {
                                    $set: {
                                        status: DONE
                                    }
                                })
                            ]);
                        } else {
                            return taskDB.updateOne({
                                _id: ObjectID(task._id)
                            }, {
                                $set: {
                                    status: DONE
                                }
                            });
                        }
                    })
                }
            } else {
                return changeStatus(task, parseInt(req.body.taskStatus));
            }
        }).then(values => {
            return res.status(200).send({
                msg: 'OK'
            });
        }).catch(err => {
            return res.status(400).send(err);
        });
    });

    post('/post/v1/deleteTask', function (req, res) {
        if (!req.body.taskID) {
            return res.status(400).send({
                err: -1,
                msg: 'Bad Request'
            });
        }

        taskDB.findOne({
            _id: ObjectID(req.body.taskID)
        }).then(task => {
            if (task.parent !== null) {
                throw ({
                    err: -1,
                    msg: 'Non-head task cannot be delete'
                });
            }
            return taskDB.deleteMany({
                $or: [{
                    ancestors: task._id
                }, {
                    _id: ObjectID(task._id)
                }]
            });
        }).then(() => {
            return res.status(200).send({
                msg: 'OK'
            });
        }).catch(err => {
            return res.status(400).send(err);
        });
    });

    post('/post/v1/listUserTask', function (req, res) {
        if (!req.body.userID) {
            return res.status(400).send({
                err: -1,
                msg: 'Bad Request'
            });
        }
        taskDB.aggregate([{
            $match: {
                owner: parseInt(req.body.userID)
            }
        }, {
            $lookup: {
                from: 'user',
                localField: 'createBy',
                foreignField: '_id',
                as: 'createBy'
            }
        }]).toArray().then(tasks => {
            Promise.all(tasks.map(task => {
                return taskDB.findOne({
                    parent: task._id
                });
            })).then(values => {
                for (let i = 0; i < values.length; i++) {
                    if (values[i] === null) {
                        tasks[i].childStatus = -1;
                    } else {
                        tasks[i].childStatus = values[i].status;
                    }
                }
                res.status(200).send({
                    tasks: tasks.map(task => {
                        task.taskID = task._id;
                        task.createBy = task.createBy[0].nicknameEn
                        delete task._id;
                        return task;
                    })
                });
            });
        });
    });
}