var ObjectID = require("mongodb").ObjectID;

module.exports = function (app, db, post, CryptoJS) {

    var userDB = db.collection('user');
    var User = db.collection("user");
    post('/post/v1/signup', function (req, res, next) {
        User.findOne({
            _id: parseInt(req.body.id)
        }, function (err, user) {
            if (err) throw err;
            if (!user) {
                let pwd = (Math.floor(Math.random() * 10000)) + '';
                User.insertOne({
                    _id: parseInt(req.body.id),
                    password: CryptoJS.SHA3(pwd).toString()
                }, function (err) {
                    if (err) throw err;
                    res.status(200).send({
                        id: parseInt(req.body.id),
                        password: pwd
                    })
                });
            } else {
                res.status(200).send({
                    err: 202,
                    msg: 'This id has been used.'
                });
            }
        });
    });

    post('/post/v1/listTutor', function (req, res) {
        userDB.find({
            position: {
                $in: ['tutor', 'admin', 'dev']
            }
        }).toArray().then(result => {
            var data = [];
            for (let i = 0; i < result.length; i++) {
                if (result[i].tutor.status == "active") {
                    result[i].tutorID = result[i]._id;
                    delete result[i]._id;
                    delete result[i].password;
                    delete result[i].firstnameEn;
                    delete result[i].lastnameEn;
                    // delete result[i].nicknameEn;
                    delete result[i].phone;
                    delete result[i].tutor;
                    data.push(result[i])
                }
            }
            res.status(200).send(data);
        });
    });

    post('/post/v1/listTutorJson', function (req, res) {
        userDB.find({
            position: {
                $in: ['tutor', 'admin', 'dev']
            },
            'tutor.status': 'active'
        }, {
                sort: {
                    _id: -1
                }
            }).toArray().then(result => {
                for (let i = 0; i < result.length; i++) {
                    result[i].tutorID = result[i]._id;
                    delete result[i]._id;
                    delete result[i].password;
                    delete result[i].firstnameEn;
                    delete result[i].lastnameEn;
                    delete result[i].phone;
                    delete result[i].tutor;
                }
                res.status(200).send({
                    tutors: result.reverse()
                });
            });
    });

    post('/post/v1/changePassword', function (req, res) {
        if (!(req.body.userID && req.body.password)) {
            return res.status(400).send({
                err: -1,
                msg: 'Bad Request'
            });
        }
        userDB.updateOne({
            _id: parseInt(req.body.userID)
        }, {
                $set: {
                    password: req.body.password
                }
            }, (err, result) => {
                if (err) {
                    return res.status(500).send({
                        err: 0,
                        msg: err
                    });
                }
                res.status(200).send('OK');
            });
    });

    post('/post/v1/userInfo', function (req, res) {
        if (!req.body.userID) {
            return res.status(400).send({
                err: -1,
                msg: 'Bad Request'
            });
        }
        userDB.findOne({
            _id: parseInt(req.body.userID)
        }).then(user => {
            delete user._id;
            res.status(200).send(user);
        });
    });

    post('/post/v1/changeSubPosition', function (req, res) {
        if (!(req.body.userID && req.body.subPosition)) {
            return res.status(400).send({
                err: -1,
                msg: 'Bad Request'
            });
        }
        userDB.updateOne({
            _id: parseInt(req.body.userID)
        }, {
                $set: {
                    subPosition: req.body.subPosition
                }
            }, (err, result) => {
                if (err) {
                    return res.status(500).send({
                        err: 0,
                        msg: err
                    });
                }
                res.status(200).send('OK');
            });
    });
    // for migration
    post('/post/v1/allUser', async function (req, res) {
        let user = await userDB.find({}, { password: 0 }).sort({ _id: 1 }).toArray();
        for (let i in user) {
            if (user[i].position == 'student') {
                user[i].status = user[i].student.status;
                delete user[i].student;
            } else {
                user[i].status = user[i].tutor.status;
                delete user[i].tutor;
            }
        }
        res.status(200).send(user);
    });
    post('/post/v1/studentState', async function (req, res) {
        let user = await userDB.find({ position: 'student' }, { level: 1, student: 1, remark: 1 }).sort({ _id: 1 }).toArray();
        let result = [];
        for (let i in user) {
            if (user[i].level == undefined) user[i].level = '';
            if (user[i].remark == undefined) user[i].remark = '';
            user[i].state = user[i].student.quarter;
            for (let j in user[i].state) {
                result.push({
                    id: user[i]._id,
                    grade: user[i].student.grade,
                    level: user[i].level,
                    remark: user[i].remark,
                    quarter: user[i].state[j].year + '' + user[i].state[j].quarter,
                    state: user[i].state[j].registrationState
                });
            }
        }
        res.status(200).send(result);
    });
}