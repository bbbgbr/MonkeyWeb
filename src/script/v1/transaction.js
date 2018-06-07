let allFieldFHB = { _id: "ObjectID", subject: "string", studentID: "number", timestamp: "Date", hybridID: "string", value: "number", sender: "number", reason: "string", remark: "string" }
let allFieldCR = { _id: "ObjectID", studentID: "number", courseID: "string", timestamp: "Date", value: "number", sender: "number", reason: "string", remark: "string" }
let checkoutHrs = { 8: 8, 9: 8, 10: 8, 11: 10, 12: 10, 13: 10, 14: 13, 15: 13, 16: 15, 17: 15, 18: 17, 19: 17, 20: 17 }
const fs = require('fs')
let subjectToNum = { 'M': 1, 'P': 2, 'C': 3, 'E': 4, 'B': 5 }
var ObjectID = require('mongodb').ObjectID;
let transactionCR
let transactionFHB
let hybridStudentDB
let configDB
let courseDB
let userDB
let attendanceDB
let checkoutLog
var gradeBitToString = function (bit) {
    var output = '',
        p = false,
        s = false;
    for (var i = 0; i < 6; i++) {
        if (bit & (1 << i)) {
            if (p == false) {
                p = true;
                output += 'P';
            }
            output += (i + 1);
        }
    }
    for (var i = 0; i < 6; i++) {
        if (bit & (1 << (i + 6))) {
            if (s == false) {
                s = true;
                output += 'S';
            }
            output += (i + 1);
        }
    }
    if (bit & (1 << 12)) output += 'SAT';
    return output;
};
module.exports = function (app, db, post, io) {
    transactionCR = db.collection('transactionCR')
    transactionFHB = db.collection('transactionFHB')
    hybridStudentDB = db.collection('hybridStudent')
    configDB = db.collection('config')
    courseDB = db.collection('course')
    userDB = db.collection('user')
    attendanceDB = db.collection('attendance')
    checkoutLog = db.collection('checkoutLog')
    post('/post/v1/testSocket', function (req, res) {
        console.log('test socket')
        io.emit('updateCheckout')
        res.status(200).send('ok')
    })

    /**
     * each obj has these parameter
     * {
     *  _id : string
     *  subject : string (1 uppercase-letter)
     *  studentID : int (studentID with a subject number at the last index -> total 6 letters)
     *  timestamp : Date
     *  hybridID : string
     *  value : int (positive to deposit and negative to withdraw)
     *  sender : int (id ; for admin com will set as Ten's id)
     *  reason : string
     *  remark : string
     * }
     * 
     */
    /**
     * req.body = {
     *  studentID : int
     *  hybridID : string
     *  value : int(negative)
     *  subject : string
     * }
     */
    post('/post/v1/checkout', async function (req, res) {
        if (!req.body.studentID || !req.body.scannedSubject) return res.status(400).send({
            err: 400,
            msg: 'bad request'
        })
        //check FHB
        let now = req.body.date ? new Date(req.body.date) : new Date()
        let studentID = parseInt(req.body.studentID)
        try {
            let [config, student] = await Promise.all([configDB.findOne(), userDB.findOne({ _id: parseInt(studentID) })])
            if (!student) res.status(200).send({ type: 'error', msg: 'ไม่มีรหัสนักเรียนนี้' })
            let quarter;
            if (now.getDay() > 0 && now.getDay() < 6 && now.getHours() < 16) quarter = config.defaultQuarter.summer;
            else quarter = config.defaultQuarter.quarter;
            let [hybrid, log, possibleCourse] = await Promise.all([
                hybridStudentDB.find({
                    quarterID: config.defaultQuarter.quarter.year + '0' + config.defaultQuarter.quarter.quarter,
                    student: { $elemMatch: { studentID: parseInt(req.body.studentID) } }
                }).toArray(),
                checkoutLog.findOne({ studentID: Number(req.body.studentID), timestamp: { $lte: now, $gte: new Date(now - (1000 * 60 * 60)) } }),
                courseDB.find({
                    student: studentID,
                    quarter: quarter.quarter,
                    year: quarter.year,
                    tutor: 99000
                }).toArray()
            ])
            if (log) {
                return res.status(200).send({ type: "error", msg: "รหัสนี้ได้ทำการ Checkout แล้ว" })
            }

            //***** check Attendance */
            let findDate = new Date(now)
            findDate.setHours(checkoutHrs[findDate.getHours()], 0, 0, 0)
            let attend = await attendanceDB.findOne({ userID: studentID, date: findDate.getTime(), type: 2 })
            let checkcr
            if (attend) {
                if (attend.courseID != 0) {
                    req.body.courseID = attend.courseID
                    checkcr = await courseDB.findOne({ _id: attend.courseID })
                    if (checkcr) {
                        if (checkcr.subject[0].toUpperCase() == req.body.scannedSubject[0].toUpperCase()) {
                            return checkoutCR(req, res, io, true, now, null, findDate.getHours())
                        }
                    }
                    return res.status(200).send({ type: 'error', msg: 'ไม่มีตารางเรียน กรุณาติดต่อ Admin' })
                } else {
                    if (req.body.scannedSubject[0].toUpperCase() == attend.subject[0].toUpperCase()) {
                        req.body.subject = attend.subject
                        req.body.hybridID = attend.hybridID
                        return checkoutFHB(req, res, io, true, now, null, findDate.getHours())
                    } else return res.status(200).send({ type: 'error', msg: 'ไม่มีตารางเรียน กรุณาติดต่อ Admin' })

                }
            }
            // check ลาเรียน
            let miss = await attendanceDB.findOne({ userID: studentID, date: findDate.getTime(), type: 1 })
            if (!miss) {
                for (let i in hybrid) {
                    let hybridTime = new Date(hybrid[i].day)
                    if (hybridTime.getDay() == now.getDay() && checkoutHrs[now.getHours()] == hybridTime.getHours()) {
                        req.body.hybridID = hybrid[i]._id;
                        for (let j in hybrid[i].student) {
                            if (hybrid[i].student[j].studentID == studentID) {
                                req.body.subject = hybrid[i].student[j].subject.toUpperCase()[0]
                                break;
                            }
                        }
                        break;
                    }
                }
                if (req.body.hybridID && req.body.subject) {
                    if (req.body.subject[0].toUpperCase() == req.body.scannedSubject[0].toUpperCase()) {
                        return checkoutFHB(req, res, io, true, now)
                    } else {
                        return res.status(200).send({ type: 'error', msg: 'ไม่มีตารางเรียน กรุณาติดต่อ Admin' })
                    }
                }
                // check CR */
                for (let i in possibleCourse) {
                    let courseDate = new Date(possibleCourse[i].day)
                    let courseDay = courseDate.getDay()
                    let courseHr = courseDate.getHours()
                    if (checkoutHrs[now.getHours()] == courseHr && (courseDay == now.getDay() || (courseDay == 1 && now.getDay() > 0 && now.getDay() < 6))) {
                        req.body.courseID = possibleCourse[i]._id
                        if (possibleCourse[i].subject[0].toUpperCase() == req.body.scannedSubject[0].toUpperCase()) {
                            return checkoutCR(req, res, io, true, now)
                        } else {
                            return res.status(200).send({ type: 'error', msg: 'ไม่มีตารางเรียน กรุณาติดต่อ Admin' })
                        }
                        break
                    }
                }
            }
            if ((now.getDay() % 6 != 0) && now.getHours() > 15 && now.getHours() < 18) {
                // check both 15 and 17
                let timestamp = new Date(now)
                now.setHours(18)
                if (now.getDay() > 0 && now.getDay() < 6 && now.getHours() < 16) quarter = config.defaultQuarter.summer;
                else quarter = config.defaultQuarter.quarter;
                [hybrid, possibleCourse] = await Promise.all([
                    hybridStudentDB.find({
                        quarterID: config.defaultQuarter.quarter.year + '0' + config.defaultQuarter.quarter.quarter,
                        student: { $elemMatch: { studentID: parseInt(req.body.studentID) } }
                    }).toArray(),
                    courseDB.find({
                        student: studentID,
                        quarter: quarter.quarter,
                        year: quarter.year,
                        tutor: 99000
                    }).toArray()
                ])
                findDate = new Date(now)
                findDate.setHours(checkoutHrs[findDate.getHours()], 0, 0, 0)
                attend = await attendanceDB.findOne({ userID: studentID, date: findDate.getTime(), type: 2 })
                if (attend) {
                    if (attend.courseID != 0) {
                        req.body.courseID = attend.courseID
                        checkcr = await courseDB.findOne({ _id: attend.courseID })
                        if (checkcr) {
                            if (checkcr.subject[0].toUpperCase() == req.body.scannedSubject[0].toUpperCase()) {
                                return checkoutCR(req, res, io, true, now, timestamp, findDate.getHours())
                            }
                        }
                        return res.status(200).send({ type: 'error', msg: 'ไม่มีตารางเรียน กรุณาติดต่อ Admin' })
                    } else {
                        if (req.body.scannedSubject[0].toUpperCase() == attend.subject[0].toUpperCase()) {
                            req.body.subject = attend.subject
                            req.body.hybridID = attend.hybridID
                            return checkoutFHB(req, res, io, true, now, timestamp, findDate.getHours())
                        } else return res.status(200).send({ type: 'error', msg: 'ไม่มีตารางเรียน กรุณาติดต่อ Admin' })

                    }
                }

                for (let i in hybrid) {
                    let hybridTime = new Date(hybrid[i].day)
                    if (hybridTime.getDay() == now.getDay() && checkoutHrs[now.getHours()] == hybridTime.getHours()) {
                        req.body.hybridID = hybrid[i]._id;
                        for (let j in hybrid[i].student) {
                            if (hybrid[i].student[j].studentID == studentID) {
                                req.body.subject = hybrid[i].student[j].subject.toUpperCase()[0]
                                break;
                            }
                        }
                        break;
                    }
                }
                if (req.body.hybridID && req.body.subject) {
                    if (req.body.subject[0].toUpperCase() == req.body.scannedSubject[0].toUpperCase()) {
                        return checkoutFHB(req, res, io, true, now, timestamp)
                    } else {
                        return res.status(200).send({ type: 'error', msg: 'ไม่มีตารางเรียน กรุณาติดต่อ Admin' })
                    }
                }
                // check CR */
                for (let i in possibleCourse) {
                    let courseDate = new Date(possibleCourse[i].day)
                    let courseDay = courseDate.getDay()
                    let courseHr = courseDate.getHours()
                    if (checkoutHrs[now.getHours()] == courseHr && (courseDay == now.getDay() || (courseDay == 1 && now.getDay() > 0 && now.getDay() < 6))) {
                        req.body.courseID = possibleCourse[i]._id
                        if (possibleCourse[i].subject[0].toUpperCase() == req.body.scannedSubject[0].toUpperCase()) {
                            return checkoutCR(req, res, io, true, now, timestamp)
                        } else {
                            return res.status(200).send({ type: 'error', msg: 'ไม่มีตารางเรียน กรุณาติดต่อ Admin' })
                        }
                        break
                    }
                }
                res.status(200).send({ type: 'error', msg: 'ไม่มีรหัสนักเรียนนี้ในตาราง' })
            } else if ((now.getDay() % 6 != 0) && now.getHours() > 17) {
                // check both 15 and 17
                let timestamp = new Date(now)
                now.setHours(17)
                if (now.getDay() > 0 && now.getDay() < 6 && now.getHours() < 16) quarter = config.defaultQuarter.summer;
                else quarter = config.defaultQuarter.quarter;
                [hybrid, possibleCourse] = await Promise.all([
                    hybridStudentDB.find({
                        quarterID: config.defaultQuarter.quarter.year + '0' + config.defaultQuarter.quarter.quarter,
                        student: { $elemMatch: { studentID: parseInt(req.body.studentID) } }
                    }).toArray(),
                    courseDB.find({
                        student: studentID,
                        quarter: quarter.quarter,
                        year: quarter.year,
                        tutor: 99000
                    }).toArray()
                ])
                findDate = new Date(now)
                findDate.setHours(checkoutHrs[findDate.getHours()], 0, 0, 0)
                attend = await attendanceDB.findOne({ userID: studentID, date: findDate.getTime(), type: 2 })
                if (attend) {
                    if (attend.courseID != 0) {
                        req.body.courseID = attend.courseID
                        checkcr = await courseDB.findOne({ _id: attend.courseID })
                        if (checkcr) {
                            if (checkcr.subject[0].toUpperCase() == req.body.scannedSubject[0].toUpperCase()) {
                                return checkoutCR(req, res, io, true, now, timestamp, findDate.getHours())
                            }
                        }
                        return res.status(200).send({ type: 'error', msg: 'ไม่มีตารางเรียน กรุณาติดต่อ Admin' })
                    } else {
                        if (req.body.scannedSubject[0].toUpperCase() == attend.subject[0].toUpperCase()) {
                            req.body.subject = attend.subject
                            req.body.hybridID = attend.hybridID
                            return checkoutFHB(req, res, io, true, now, timestamp, findDate.getHours())
                        } else return res.status(200).send({ type: 'error', msg: 'ไม่มีตารางเรียน กรุณาติดต่อ Admin' })

                    }
                }

                for (let i in hybrid) {
                    let hybridTime = new Date(hybrid[i].day)
                    if (hybridTime.getDay() == now.getDay() && checkoutHrs[now.getHours()] == hybridTime.getHours()) {
                        req.body.hybridID = hybrid[i]._id;
                        for (let j in hybrid[i].student) {
                            if (hybrid[i].student[j].studentID == studentID) {
                                req.body.subject = hybrid[i].student[j].subject.toUpperCase()[0]
                                break;
                            }
                        }
                        break;
                    }
                }
                if (req.body.hybridID && req.body.subject) {
                    if (req.body.subject[0].toUpperCase() == req.body.scannedSubject[0].toUpperCase()) {
                        return checkoutFHB(req, res, io, true, now, timestamp)
                    } else {
                        return res.status(200).send({ type: 'error', msg: 'ไม่มีตารางเรียน กรุณาติดต่อ Admin' })
                    }
                }
                // check CR */
                for (let i in possibleCourse) {
                    let courseDate = new Date(possibleCourse[i].day)
                    let courseDay = courseDate.getDay()
                    let courseHr = courseDate.getHours()
                    if (checkoutHrs[now.getHours()] == courseHr && (courseDay == now.getDay() || (courseDay == 1 && now.getDay() > 0 && now.getDay() < 6))) {
                        req.body.courseID = possibleCourse[i]._id
                        if (possibleCourse[i].subject[0].toUpperCase() == req.body.scannedSubject[0].toUpperCase()) {
                            return checkoutCR(req, res, io, true, now, timestamp)
                        } else {
                            return res.status(200).send({ type: 'error', msg: 'ไม่มีตารางเรียน กรุณาติดต่อ Admin' })
                        }
                        break
                    }
                }
                res.status(200).send({ type: 'error', msg: 'ไม่มีรหัสนักเรียนนี้ในตาราง' })
            }
            else res.status(200).send({ type: 'error', msg: 'ไม่มีรหัสนักเรียนนี้ในตาราง' })
        } catch (error) {
            return res.status(200).send({ type: 'error', msg: error.toString() })
        }

    })

    post('/post/v1/checkoutFHB', function (req, res) {
        return checkoutFHB(req, res)
    })
    post('/post/v1/checkoutCR', function (req, res) {
        return checkoutCR(req, res)
    })
    /**
     * add new transaction
     * parameter is all key in transaction object
     * req.body = {
     *  studentID : int
     *  timestamp : int (not necessary ; default is current date)
     *  value : int (positive to deposit and negative to withdraw)
     *  subject : string
     *  sender : int 
     *  reason : string
     *  remark : string (not necessary)
     * }
     */
    post('/post/v1/addTransactionFHB', async function (req, res) {
        if (!(req.body.studentID && req.body.value && req.body.sender && req.body.reason && req.body.subject)) {
            return res.status(400).send({
                err: 400,
                msg: 'Bad Reqeust'
            });
        }
        try {
            if (!req.body.notWrite) {
                let path = process.env.STUDENT_CSV + '/' + req.body.studentID + subjectToNum[req.body.subject[0].toUpperCase()] + '.csv'
                fs.readFile(path, (err, data) => {
                    let date = new Date()
                    let balance = 0
                    if (err) {
                        fs.writeFile(path, 'Date,Check In,Check Out,Increment,Decrement,Balance,Note\n0,0,0,0,0,0,This file was written by MonkeyAdmin\n', (err2) => {
                            if (err2) throw err2
                            if (parseInt(req.body.value) < 0) {
                                fs.appendFile(path, ((date.getDate() > 9) ? date.getDate() : '0' + date.getDate()) + '/' +
                                    ((date.getMonth() + 1 > 9) ? (date.getMonth() + 1) : '0' + (date.getMonth() + 1)) + '/' +
                                    (date.getFullYear() + 543) + ',No Check In,' + date.toTimeString().split(' ')[0] +
                                    ',,' + (-1 * parseInt(req.body.value)) + ',' + (parseInt(balance) + parseInt(req.body.value)) + ',' + req.body.reason + '\n', (err) => {
                                        if (err) {
                                            var dateobj = new Date()
                                            var errlog = dateobj.toLocaleString() + ' // ' + err + '\r' + '\n'
                                            fs.appendFile(config.get('studentfilelocation') + 'errlog.txt', errlog)
                                            throw err
                                        }
                                    })
                            } else {
                                fs.appendFile(path, ((date.getDate() > 9) ? date.getDate() : '0' + date.getDate()) + '/' +
                                    ((date.getMonth() + 1 > 9) ? (date.getMonth() + 1) : '0' + (date.getMonth() + 1)) + '/' +
                                    (date.getFullYear() + 543) + ',No Check In,' + date.toTimeString().split(' ')[0] +
                                    ',' + (parseInt(req.body.value)) + ',,' + (parseInt(balance) + parseInt(req.body.value)) + ',' + req.body.reason + '\n', (err) => {
                                        if (err) {
                                            var dateobj = new Date()
                                            var errlog = dateobj.toLocaleString() + ' // ' + err + '\r' + '\n'
                                            fs.appendFile(config.get('studentfilelocation') + 'errlog.txt', errlog)
                                            throw err
                                        }
                                    })
                            }
                        })
                    } else {
                        temp = data.toString().split('\n')
                        balance = parseInt(temp[temp.length - 2].split(',')[5])
                        if (parseInt(req.body.value) < 0) {
                            fs.appendFile(path, ((date.getDate() > 9) ? date.getDate() : '0' + date.getDate()) + '/' +
                                ((date.getMonth() + 1 > 9) ? (date.getMonth() + 1) : '0' + (date.getMonth() + 1)) + '/' +
                                (date.getFullYear() + 543) + ',No Check In,' + date.toTimeString().split(' ')[0] +
                                ',,' + (-1 * parseInt(req.body.value)) + ',' + (parseInt(balance) + parseInt(req.body.value)) + ',' + req.body.reason + '\n', (err) => {
                                    if (err) {
                                        var dateobj = new Date()
                                        var errlog = dateobj.toLocaleString() + ' // ' + err + '\r' + '\n'
                                        fs.appendFile(config.get('studentfilelocation') + 'errlog.txt', errlog)
                                        throw err
                                    }
                                })
                        } else {
                            fs.appendFile(path, ((date.getDate() > 9) ? date.getDate() : '0' + date.getDate()) + '/' +
                                ((date.getMonth() + 1 > 9) ? (date.getMonth() + 1) : '0' + (date.getMonth() + 1)) + '/' +
                                (date.getFullYear() + 543) + ',No Check In,' + date.toTimeString().split(' ')[0] +
                                ',' + (parseInt(req.body.value)) + ',,' + (parseInt(balance) + parseInt(req.body.value)) + ',' + req.body.reason + '\n', (err) => {
                                    if (err) {
                                        var dateobj = new Date()
                                        var errlog = dateobj.toLocaleString() + ' // ' + err + '\r' + '\n'
                                        fs.appendFile(config.get('studentfilelocation') + 'errlog.txt', errlog)
                                        throw err
                                    }
                                })
                        }
                    }
                })
            }
            let insObj = {
                studentID: parseInt(req.body.studentID),
                timestamp: req.body.timestamp ? new Date(parseInt(req.body.timestamp)) : new Date(),
                value: parseInt(req.body.value),
                subject: req.body.subject.toUpperCase()[0],
                sender: parseInt(req.body.sender),
                reason: req.body.reason,
                remark: req.body.remark ? req.body.remark : ""
            }
            await transactionFHB.insertOne(insObj)
            return res.status(200).send({ msg: "ok" })
        } catch (e) {
            return res.status(500).send({ err: 500, msg: e.toString() })
        }
    })
    post('/post/v1/addTransactionCR', async function (req, res) {
        if (!(req.body.studentID && req.body.value && req.body.sender && req.body.reason && req.body.courseID)) {
            return res.status(400).send({
                err: 400,
                msg: 'Bad Reqeust'
            });
        }
        try {
            let insObj = {
                studentID: parseInt(req.body.studentID),
                timestamp: req.body.timestamp ? new Date(parseInt(req.body.timestamp)) : new Date(),
                value: parseInt(req.body.value),
                courseID: req.body.courseID,
                sender: parseInt(req.body.sender),
                reason: req.body.reason,
                remark: req.body.remark ? req.body.remark : ""
            }
            await transactionCR.insertOne(insObj)
            return res.status(200).send({ msg: "ok" })
        } catch (e) {
            return res.status(500).send({ err: 500, msg: e.toString() })
        }
    })
    /**
     * get all transaction of request id
     * req.body = {
     *  studentID : int,
     *  subject : string,
     *  startDate : int (not necessary),
     *  endDate : int (not necessary)
     * }
     */
    post('/post/v1/getTransactionFHB', async function (req, res) {
        if (!req.body.studentID || !req.body.subject) {
            return res.status(400).send({
                err: 400,
                msg: 'Bad Reqeust'
            });
        }
        let findObj = { studentID: parseInt(req.body.studentID), subject: req.body.subject[0].toUpperCase() }
        let time = {}
        if (req.body.startDate) time.$gte = new Date(parseInt(req.body.startDate));
        if (req.body.endDate) time.$lte = new Date(parseInt(req.body.endDate));
        if (time.$gte || time.$lte) findObj.timestamp = time;
        try {
            let arr = await transactionFHB.find(findObj).sort({ timestamp: -1 }).toArray()
            return res.status(200).send({ transactionArr: arr })
        } catch (e) {
            return res.status(500).send({ err: e })
        }
    })
    post('/post/v1/getTransactionCR', async function (req, res) {
        if (!req.body.studentID || !req.body.courseID) {
            return res.status(400).send({
                err: 400,
                msg: 'Bad Reqeust'
            });
        }
        let findObj = { studentID: parseInt(req.body.studentID), courseID: req.body.courseID }
        let time = {}
        if (req.body.startDate) time.$gte = new Date(parseInt(req.body.startDate));
        if (req.body.endDate) time.$lte = new Date(parseInt(req.body.endDate));
        if (time.$gte || time.$lte) findObj.timestamp = time;
        try {
            let arr = await transactionCR.find(findObj).sort({ timestamp: 1 }).toArray()
            return res.status(200).send({ transactionArr: arr })
        } catch (e) {
            return res.status(500).send({ err: e })
        }
    })
    /**
     * return sum of transaction value and last update
     * req.body = {
     *  studentID : int 
     *  subject : string
     * } -> return an object
     * 
     * req.body = {
     *  studentArr : [{
     *      studentID:int
     *      subject:string
     *  }]
     * } -> return arr
     * 
     * if studentID is int -> return an object
     * if studentArr -> return an array of objects
     * if no studentID -> return an array of all objects
     */
    post('/post/v1/getTotalTransactionFHB', async function (req, res) {
        if (req.body.studentID && req.body.subject) {
            try {
                let total = await transactionFHB.aggregate([
                    { $match: { studentID: parseInt(req.body.studentID), subject: req.body.subject[0].toUpperCase() } },
                    { $group: { _id: { studentID: "$studentID", subject: "$subject" }, total: { $sum: "$value" }, lastUpdate: { $max: "$timestamp" } } },
                    { $project: { _id: 0, studentID: "$_id.studentID", subject: "$_id.subject", total: "$total", lastUpdate: "$lastUpdate" } },
                ]).toArray()
                if (total.length == 0) return res.status(200).send({ studentID: Number(req.body.studentID.slice(0, 5)), subject: req.body.subject[0].toUpperCase(), total: 0, lastUpdate: new Date(0) })
                else return res.status(200).send(total[0])
            } catch (error) {
                return res.status(500).send({ err: 500, msg: error.toString() })
            }
        } else if (req.body.studentArr) {
            try {
                let total = []
                for (i in req.body.studentArr) {
                    let temp = (await transactionFHB.aggregate([
                        { $match: { studentID: parseInt(req.body.studentArr[i].studentID), subject: req.body.studentArr[i].subject[0].toUpperCase() } },
                        { $group: { _id: { studentID: "$studentID", subject: "$subject" }, total: { $sum: "$value" }, lastUpdate: { $max: "$timestamp" } } },
                        { $project: { _id: 0, studentID: "$_id.studentID", subject: "$_id.subject", total: "$total", lastUpdate: "$lastUpdate" } }
                    ]).toArray())[0]
                    if (!temp) total.push({ studentID: Number(req.body.studentID.slice(0, 5)), subject: req.body.subject[0].toUpperCase(), total: 0, lastUpdate: new Date(0) })
                    else total.push(temp)
                }
                return res.status(200).send({ transactionArr: total })
            } catch (error) {
                return res.status(500).send({ err: error })
            }
        } else if (!(req.body.studentID && req.body.subject && req.body.studentArr)) {
            try {
                let total = await transactionFHB.aggregate([
                    { $group: { _id: { studentID: "$studentID", subject: "$subject" }, total: { $sum: "$value" }, lastUpdate: { $max: "$timestamp" } } },
                    { $project: { _id: 0, studentID: "$_id.studentID", subject: "$_id.subject", total: "$total", lastUpdate: "$lastUpdate" } },
                    {
                        $lookup: {
                            from: 'user',
                            localField: 'studentID',
                            foreignField: '_id',
                            as: "user"
                        }
                    },
                    { $match: { "user.student.status": "active" } },
                    { $unwind: "$user" },
                    { $project: { _id: 0, studentID: "$studentID", subject: "$subject", total: "$total", lastUpdate: "$lastUpdate", firstname: "$user.firstname", lastname: "$user.lastname", nickname: "$user.nickname" } },
                    { $sort: { studentID: 1, subject: 1 } }
                ]).toArray()
                return res.status(200).send({ transactionArr: total })
            } catch (error) {
                return res.status(500).send({ err: error })
            }
        } else {
            return res.status(400).send({ err: 400, msg: "bad request" })
        }
    })
    post('/post/v1/getTotalTransactionCR', async function (req, res) {
        if (req.body.studentID && req.body.courseID) {
            try {
                let total = await transactionCR.aggregate([
                    { $match: { studentID: parseInt(req.body.studentID), courseID: req.body.courseID } },
                    { $group: { _id: { studentID: "$studentID", courseID: "$courseID" }, total: { $sum: "$value" }, lastUpdate: { $max: "$timestamp" } } },
                    { $project: { _id: 0, studentID: "$_id.studentID", courseID: "$_id.courseID", total: "$total", lastUpdate: "$lastUpdate" } },
                ]).toArray()
                if (total.length == 0) return res.status(200).send({ studentID: Number(req.body.studentID.slice(0, 5)), courseID: courseID, total: 0, lastUpdate: new Date(0) })
                else return res.status(200).send(total[0])
            } catch (error) {
                return res.status(500).send({ err: 500, msg: error.toString() })
            }
        } else if (req.body.studentID) {
            try {
                let total = await transactionCR.aggregate([
                    { $match: { studentID: parseInt(req.body.studentID) } },
                    { $group: { _id: { studentID: "$studentID", courseID: "$courseID" }, total: { $sum: "$value" }, lastUpdate: { $max: "$timestamp" } } },
                    { $project: { _id: 0, studentID: "$_id.studentID", courseID: "$_id.courseID", total: "$total", lastUpdate: "$lastUpdate" } },
                ]).toArray()
                if (total.length == 0) return res.status(200).send({ studentID: Number(req.body.studentID.slice(0, 5)), courseID: '', total: 0, lastUpdate: new Date(0) })
                else return res.status(200).send(total[0])
            } catch (error) {
                return res.status(500).send({ err: 500, msg: error.toString() })
            }
        } else if (req.body.studentArr) {
            try {
                let total = []
                for (i in req.body.studentArr) {
                    let match = { studentID: parseInt(req.body.studentArr[i].studentID) }
                    if (req.body.studentArr[i].courseID) match.courseID = req.body.studentArr[i].courseID
                    let temp = (await transactionCR.aggregate([
                        { $match: match },
                        { $group: { _id: { studentID: "$studentID", courseID: "$courseID" }, total: { $sum: "$value" }, lastUpdate: { $max: "$timestamp" } } },
                        { $project: { _id: 0, studentID: "$_id.studentID", subject: "$_id.courseID", total: "$total", lastUpdate: "$lastUpdate" } }
                    ]).toArray())[0]
                    if (!temp) total.push({ studentID: Number(req.body.studentID.slice(0, 5)), subject: req.body.subject[0].toUpperCase(), total: 0, lastUpdate: new Date(0) })
                    else total.push(temp)
                }
                return res.status(200).send(total)
            } catch (error) {
                return res.status(500).send({ err: error })
            }
        } else if (!(req.body.studentID && req.body.subject && req.body.studentArr)) {
            try {
                let total = await transactionCR.aggregate([
                    { $group: { _id: { studentID: "$studentID", courseID: "$courseID" }, total: { $sum: "$value" }, lastUpdate: { $max: "$timestamp" } } },
                    { $project: { _id: 0, studentID: "$_id.studentID", courseID: "$_id.courseID", total: "$total", lastUpdate: "$lastUpdate" } }
                ]).toArray()
                return res.status(200).send(total)
            } catch (error) {
                return res.status(500).send({ err: error })
            }
        } else {
            return res.status(400).send({ err: 400, msg: "bad request" })
        }
    })
    /**
     * return an array of under2500
     * req.body is not necessary
     */
    post('/post/v1/getUnder2500', async function (req, res) {
        try {
            let config = await configDB.findOne()
            let query = { quarterID: (config.defaultQuarter.quarter.year) + '0' + (config.defaultQuarter.quarter.quarter) }
            let fhb = await hybridStudentDB.find(query).toArray()
            let under2500 = await transactionFHB.aggregate([
                { $group: { _id: { studentID: "$studentID", subject: "$subject" }, total: { $sum: "$value" }, lastUpdate: { $max: "$timestamp" } } },
                { $match: { total: { $lte: 2500 } } },
                { $project: { studentID: "$_id.studentID", subject: "$_id.subject", total: "$total", lastUpdate: "$lastUpdate" } },
                {
                    $lookup: {
                        from: 'user',
                        localField: 'studentID',
                        foreignField: '_id',
                        as: "user"
                    }
                },
                { $match: { "user.student.status": "active" } },
                { $unwind: "$user" },
                { $project: { _id: 0, studentID: "$studentID", subject: "$subject", total: "$total", lastUpdate: "$lastUpdate", firstname: "$user.firstname", lastname: "$user.lastname", nickname: "$user.nickname" } },
            ]).toArray()
            let ans = [];
            for (let i in under2500) {
                for (let j in fhb) {
                    let f = false;
                    for (let k in fhb[j].student) {
                        if (under2500[i].studentID == fhb[j].student[k].studentID && under2500[i].subject == fhb[j].student[k].subject) {
                            ans.push(under2500[i])
                            f = true
                            break;
                        }
                    }
                    if (f) break;
                }
            }
            let y = new Date()
            return res.status(200).send({ arr: ans })
        } catch (error) {
            return res.status(500).send({ err: error })
        }
    })

    /**
     * req.body = {
     *  _id : string
     * }
     * 
     */
    post('/post/v1/editTransactionFHB', async function (req, res) {
        if (!(req.body._id && checkBodyFHB(req.body))) {
            return res.status(400).send({
                err: 400,
                msg: 'Bad Reqeust'
            });
        }
        try {
            let id = ObjectID(req.body._id)
            delete req.body._id
            for (i in req.body) req.body[i] = parseTransactionFHB(i, req.body[i]);
            await transactionFHB.updateOne({ _id: id }, { $set: req.body })
            return res.status(200).send({ msg: "ok" })
        } catch (error) {
            return res.status(500).send({ msg: error })
        }
    })
    post('/post/v1/editTransactionCR', async function (req, res) {
        if (!(req.body._id && checkBodyCR(req.body))) {
            return res.status(400).send({
                err: 400,
                msg: 'Bad Reqeust'
            });
        }
        try {
            let id = ObjectID(req.body._id)
            delete req.body._id
            for (i in req.body) req.body[i] = parseTransactionCR(i, req.body[i]);
            await transactionCR.updateOne({ _id: id }, { $set: req.body })
            return res.status(200).send({ msg: "ok" })
        } catch (error) {
            return res.status(500).send({ msg: error })
        }
    })

    /**
     *  req.body = {
     *  _id : string
     * }
     * 
     */
    post('/post/v1/deleteTransactionFHB', async function (req, res) {
        if (!req.body._id) {
            return res.status(400).send({
                err: 400,
                msg: 'Bad Reqeust'
            });
        }
        try {
            await transactionFHB.remove({ _id: ObjectID(req.body._id) })
            return res.status(200).send({ msg: "ok" })
        } catch (error) {
            return res.status(500).send({ msg: error })
        }
    })
    post('/post/v1/deleteTransactionCR', async function (req, res) {
        if (!req.body.courseID) {
            return res.status(400).send({
                err: 400,
                msg: 'Bad Reqeust'
            });
        }
        try {
            await transactionCR.remove({ _id: ObjectID(req.body.courseID) })
            return res.status(200).send({ msg: "ok" })
        } catch (error) {
            return res.status(500).send({ msg: error })
        }
    })


}
function checkBodyFHB(bd) {
    for (i in bd) if (!allFieldFHB[i]) return false;
    return true;
}
function parseTransactionFHB(key, value) {
    if (allFieldFHB[key] == "number") return Number(value);
    if (allFieldFHB[key] == "Date") return new Date(value);
    if (allFieldFHB[key] == "ObjectID") return ObjectID(value);
    return value;
}
async function checkoutFHB(req, res, io, ioEmit, d, timestamp, round) {
    if (!(req.body.studentID)) {
        return res.status(400).send({
            err: 400,
            msg: 'Bad Reqeust'
        });
    }
    let hybridID
    let fhb
    if (!req.body.hybridID) {
        let now = d ? new Date(d) : new Date()
        let config = await configDB.findOne()
        let hybrid = await hybridStudentDB.find({
            quarterID: config.defaultQuarter.quarter.year + '0' + config.defaultQuarter.quarter.quarter,
            student: { $elemMatch: { studentID: parseInt(req.body.studentID) } }
        }).toArray()
        for (let i in hybrid) {
            let hybridTime = new Date(hybrid[i].day)
            if (hybridTime.getDay() == now.getDay() && checkoutHrs[now.getHours()] == hybridTime.getHours()) {
                fhb = hybrid[i]
                hybridID = hybrid[i]._id;
                break
            }
        }
        if (hybridID) req.body.hybridID = hybridID;
        else return res.status(400).send({
            err: 400,
            msg: 'Bad Reqeust'
        })
    } else {
        fhb = await hybridStudentDB.findOne({ _id: ObjectID(req.body.hybridID) })
    }
    let studentID = parseInt(req.body.studentID)
    let value = parseInt(req.body.value ? req.body.value : -800)
    try {
        let date = d ? new Date(d) : new Date()
        await Promise.all([
            transactionFHB.insertOne({
                studentID: studentID,
                timestamp: timestamp ? timestamp : date,
                subject: req.body.subject[0].toUpperCase(),
                value: value,
                sender: studentID,
                reason: "CheckoutFHB",
                remark: "",
                hybridID: req.body.hybridID
            }),
            addCheckoutLog(studentID, req.body.subject[0].toUpperCase(), round ? round : new Date(fhb.day).getHours(), timestamp ? timestamp : date)
        ])
        if (ioEmit) io.emit('updateCheckout')
        return res.status(200).send({ msg: "ok", type: 'fhb' })
    } catch (e) {
        return res.status(500).send({ err: 500, msg: e.toString() })
    }
}
/**
 * 
 * @param {studentID : int , courseID : string(optional)} req 
 * @param {*} res 
 */
async function checkoutCR(req, res, io, ioEmit, d, timestamp, round) {
    if (!(req.body.studentID)) {
        return res.status(400).send({
            err: 400,
            msg: 'Bad Reqeust'
        });
    }
    let studentID = parseInt(req.body.studentID.slice(0, 5))
    let value = -1
    let date = d ? new Date(d) : new Date()
    let day = date.getDay()
    let hr = date.getHours()
    try {
        let config = await configDB.findOne({})
        let quarter
        if (day > 0 && day < 6 && hr < 16) quarter = config.defaultQuarter.summer;
        else quarter = config.defaultQuarter.quarter;
        if (req.body.courseID) {
            let courseID = req.body.courseID
            let ensureCR = await courseDB.findOne({ _id: courseID })
            if (ensureCR) {
                await transactionCR.insertOne({
                    studentID: studentID,
                    timestamp: timestamp ? timestamp : date,
                    courseID: courseID,
                    value: value,
                    sender: studentID,
                    reason: "CheckoutCR",
                    remark: req.body.remark ? req.body.remark : "",
                })
                let courseName = ensureCR.subject + gradeBitToString(ensureCR.grade) + ensureCR.level
                addCheckoutLog(studentID, ensureCR.subject, round ? round : new Date(ensureCR.day).getHours(), date).then(() => {
                    if (ioEmit) io.emit('updateCheckout')
                    return res.status(200).send({ msg: "ok", type: 'cr', courseName: courseName })
                })
            } else {
                return res.status(400).send({ err: 400, msg: 'Cannot find this courseID' })
            }
        } else {
            let possibleCourse = await courseDB.find({
                student: studentID,
                quarter: quarter.quarter,
                year: quarter.year,
                tutor: 99000
            }).toArray()
            let courseID;
            let subject;
            let ensureCR
            for (let i in possibleCourse) {
                let courseDate = new Date(possibleCourse[i].day)
                let courseDay = courseDate.getDay()
                let courseHr = courseDate.getHours()
                if (checkoutHrs[hr] == courseHr && (courseDay == day || (courseDay == 0 && day > 0 && day < 6))) {
                    ensureCR = possibleCourse[i]
                    courseID = possibleCourse[i]._id
                    subject = possibleCourse[i].subject
                    break
                }
            }
            if (courseID) {
                await Promise.all([
                    transactionCR.insertOne({
                        studentID: studentID,
                        timestamp: timestamp ? timestamp : date,
                        courseID: courseID,
                        value: value,
                        sender: studentID,
                        reason: "CheckoutCR",
                        remark: req.body.remark ? req.body.remark : "",
                    }),
                    addCheckoutLog(studentID, ensureCR.subject, round ? round : new Date(ensureCR.day).getHours(), date)
                ])
                let courseName = ensureCR.subject + gradeBitToString(ensureCR.grade) + ensureCR.level
                if (ioEmit) io.emit('updateCheckout')
                return res.status(200).send({ msg: "ok", type: 'cr', courseName: courseName })
            } else {
                return res.status(400).send({ err: 400, msg: 'Cannot find course at this time' })
            }
        }
    } catch (e) {
        return res.status(500).send({ err: e })
    }
}

function checkBodyCR(bd) {
    for (i in bd) if (!allFieldCR[i]) return false;
    return true;
}
function parseTransactionCR(key, value) {
    if (allFieldCR[key] == "number") return Number(value);
    if (allFieldCR[key] == "Date") return new Date(value);
    if (allFieldCR[key] == "ObjectID") return ObjectID(value);
    return value;
}

function addCheckoutLog(studentID, subject, checkoutRound, timestamp, recheck, recheckDate) {
    let promise = new Promise((res, rej) => {
        let obj = {
            studentID: studentID,
            subject: subject,
            checkoutRound: checkoutRound ? Number(checkoutRound) : new Date().getHours(),
            timestamp: timestamp ? new Date(timestamp) : new Date(),
            recheck: recheck ? recheck : false
        }
        if (recheckDate) obj.recheckDate = new Date(recheckDate)
        checkoutLog.insertOne(obj, () => { res() })
    })
    return promise;
}