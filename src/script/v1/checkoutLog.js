var ObjectID = require('mongodb').ObjectID;
module.exports = function(app,db,post,io){
    let checkoutLog = db.collection('checkoutLog')
    let userDB = db.collection('user')
    let hybridStudent = db.collection('hybridStudent')
    let courseDB = db.collection('course')
    let configDB = db.collection('config')
    let attendanceDB = db.collection('attendance')
    let attendanceDocumentDB = db.collection('attendanceDocument')
    /**@param req.body
     *  timestamp : Date
     *  checkoutRound : int
     *  studentID : int
     *  subject : string
     *  recheck : bool
     *  recheckDate : Date
     */
    post('/post/v1/addCheckoutLog',async function(req,res){
        if(!(req.body.studentID&&req.body.subject)){
            res.status(400).send({err:400 , msg:'bad request'})
        }
        try {
            let studentID = req.body.studentID
            let subject = req.body.subject
            let obj = {
                studentID : studentID,
                subject : subject,
                timestamp : req.body.timestamp?new Date(req.body.timestamp) : new Date(),
                checkoutRound : req.body.checkoutRound?Number(req.body.checkoutRound) : new Date().getHours(),
                recheck : (req.body.recheck+'') == 'true'
            }
            if(req.body.recheckDate) obj.recheckDate = new Date(req.body.obj.recheckDate)
            await checkoutLog.insertOne(obj)
            res.status(200).send({msg:'ok'})    
        } catch (error) {
            res.status(500).send({err:500,msg:'insert failed'})
        }
    })

    post('/post/v1/recheck',async function(req,res){
        if(!(req.body.studentID&&req.body.subject)){
            res.status(400).send({err:400 , msg:'bad request'})
        }
        try {
            let studentID = parseInt(req.body.studentID)
            let subject = req.body.subject[0].toUpperCase()
            let recheckDate = new Date()
            await checkoutLog.updateMany({studentID:studentID , subject:subject , recheck:false} , {$set:{recheck:true , recheckDate:recheckDate}})
            io.emit('updateCheckout')
            res.status(200).send({msg:'ok'})
        } catch (error) {
            res.status(500).send({err:500,msg:'recheck failed'})
        }
    })

    post('/post/v1/getCheckout',async function(req,res){
        try {
            let start = req.body.date?new Date(req.body.date):new Date()
            let end = req.body.date?new Date(req.body.date):new Date()
            start.setHours(0,0,0,0)
            end.setHours(23,59,59,999)
            let time = {8:new Date(start) , 10: new Date(start) , 13: new Date(start) , 15:new Date(start) , 17:new Date(start) , 9:new Date(start) , 11: new Date(start) , 12: new Date(start) , 14:new Date(start) , 16:new Date(start) , 18:new Date(start) , 19:new Date(start) ,20:new Date(start),21:new Date(start),22:new Date(start),23:new Date(start),24:new Date(start)}
            for(let i in time) time[i].setHours(i);
            let config = await configDB.findOne({})
            let year = Number(config.defaultQuarter.quarter.year)
            let quarter = Number(config.defaultQuarter.quarter.quarter)
            let quarterID = config.defaultQuarter.quarter.year+"0"+config.defaultQuarter.quarter.quarter
            let [fhb , course , checkout , attendance , user] = await Promise.all([
                hybridStudent.find({quarterID:quarterID}).toArray(),
                courseDB.find({$or: [{year:year , quarter:quarter},{year:year , quarter:Number(config.defaultQuarter.summer.quarter)}] , tutor:99000}).toArray(),
                Promise.all([
                    checkoutLog.find({timestamp:{$gte: start, $lt:end} , checkoutRound : 8}).toArray(),
                    checkoutLog.find({timestamp:{$gte: start, $lt:end} , checkoutRound : 10}).toArray(),
                    checkoutLog.find({timestamp:{$gte: start, $lt:end} , checkoutRound : 13}).toArray(),
                    checkoutLog.find({timestamp:{$gte: start, $lt:end} , checkoutRound : 15}).toArray(),
                    checkoutLog.find({timestamp:{$gte: start, $lt:end} , checkoutRound : 17}).toArray(),
                ]),
                Promise.all([
                    attendanceDB.find({date:time[8].getTime()}).toArray(),
                    attendanceDB.find({date:time[10].getTime()}).toArray(),
                    attendanceDB.find({date:time[13].getTime()}).toArray(),
                    attendanceDB.find({date:time[15].getTime()}).toArray(),
                    attendanceDB.find({date:time[17].getTime()}).toArray(),
                ]),
                userDB.find({position:"student"}).toArray(),
            ])
            let studentObj = {}
            for(let i in user){
                studentObj[user[i]._id] = {firstname:user[i].firstname , lastname:user[i].lastname , nickname:user[i].nickname , grade:((user[i].student.grade>6?'S':'P')+(user[i].student.grade>6?(user[i].student.grade-6):user[i].student.grade))}
                if(user[i].student.quarter.find((e)=> e.year == year && e.quarter == quarter && e.registrationState != 'rejected' && user[i].student.status == 'active')){
                    studentObj[user[i]._id].defaultQuarter = true
                }else studentObj[user[i]._id].defaultQuarter = false
                if(user[i].student.quarter.find((e)=> e.year == year && e.quarter == config.defaultQuarter.summer.quarter && e.registrationState != 'rejected' && user[i].student.status == 'active')){
                    studentObj[user[i]._id].defaultSummer = true
                }else studentObj[user[i]._id].defaultSummer = false
            }
            let checkoutObj = {8:checkout[0] , 10:checkout[1] , 13:checkout[2] , 15:checkout[3] , 17:checkout[4]}
            let attendanceObj ={8:attendance[0] , 10:attendance[1] , 13:attendance[2] , 15:attendance[3] , 17:attendance[4]}
            let student = {8:[] , 10:[] , 13:[] , 15:[] , 17:[]}
            for(let i in fhb){
                fhb[i].day = new Date(fhb[i].day)
                if(fhb[i].day.getDay() == start.getDay() || (fhb[i].day.getDay() == 1 && start.getDay()%6!=0 && config.inSummer)){
                    student[fhb[i].day.getHours()] = student[fhb[i].day.getHours()].concat(fhb[i].student.filter(e=>{
                        return studentObj[e.studentID].defaultQuarter
                    }).map((e)=>{
                        e.type = "fhb"
                        let findCheckout = checkoutObj[fhb[i].day.getHours()].find(check=>{return check.studentID == e.studentID && check.subject == e.subject})
                        if(findCheckout){
                            e.checkout = findCheckout.timestamp
                            e.recheck = findCheckout.recheck
                        }
                        let findAttendance = attendanceObj[fhb[i].day.getHours()].find(att=>{
                            if(att.courseID == 0) return att.userID == e.studentID;
                            else return false;
                        })
                        if(findAttendance){
                            if(findAttendance.type == 1){
                                let attendanceTimestamp = new Date(findAttendance.timestamp)
                                let attendanceDate = new Date(findAttendance.date)
                                attendanceDate.setHours(18,0,0,0)
                                if(attendanceDate.getDay() == 0) attendanceDate.setDate(attendanceDate.getDate()-1)
                                e.reason = findAttendance.reason
                                e.status = 'absent'
                                attendanceDocumentDB.findOne({attendanceID:findAttendance._id.toString()},(err,img)=>{
                                    e.img = img?img._id:null
                                })
                                if(attendanceDate-attendanceTimestamp<1000*60*60*24) e.status+='Late'
                            }else if(findAttendance.type == 2) e.status = 'err:เพิ่มในรอบที่มีเรียนอยู่แล้ว'
                            else e.status = 'err'
                        }else{
                            e.status = 'normal'
                        }
                        return e
                    }))
                }
            }
            for(let i in course){
                course[i].day = new Date(course[i].day)
                if(course[i].day.getDay() == start.getDay() || (course[i].day.getDay() == 1 && start.getDay()%6!=0 && config.inSummer)){
                    student[course[i].day.getHours()] = student[course[i].day.getHours()].concat(course[i].student.filter(e=>{
                        if(course[i].quarter > 10) return studentObj[e].defaultSummer
                        else return studentObj[e].defaultQuarter
                    }).map((studentID)=>{
                        let e = {studentID:studentID}
                        e.subject = course[i].subject
                        e.type = "cr"
                        let findCheckout = checkoutObj[course[i].day.getHours()].find(check=>{return check.studentID == e.studentID && check.subject == e.subject})
                        if(findCheckout){
                            e.checkout = findCheckout.timestamp
                            e.recheck = findCheckout.recheck
                        }
                        let findAttendance = attendanceObj[course[i].day.getHours()].find(att=>{
                            if(att.courseID!=0) return att.userID == e.studentID
                            else return false;
                        })
                        if(findAttendance){
                            if(findAttendance.type == 1){
                                let attendanceTimestamp = new Date(findAttendance.timestamp)
                                let attendanceDate = new Date(findAttendance.date)
                                attendanceDate.setHours(18,0,0,0)
                                if(attendanceDate.getDay() == 0) attendanceDate.setDate(attendanceDate.getDate()-1)
                                e.reason = findAttendance.reason
                                e.status = 'absent'
                                attendanceDocumentDB.findOne({attendanceID:findAttendance._id.toString()},(err , img)=>{
                                    e.img = img?img._id:null
                                })
                                if(attendanceDate-attendanceTimestamp<1000*60*60*24) e.status+='Late'
                            }else if(findAttendance.type == 2) e.status = 'err:เพิ่มในรอบที่มีเรียนอยู่แล้ว'
                            else e.status = 'err'
                        }else{
                            e.status = 'normal'
                        }
                        return e
                    }))
                }
            }
            for(let i in attendanceObj){
                for(let j in attendanceObj[i]){
                    if(attendanceObj[i][j].type == 2){
                        attendanceObj[i][j].date = new Date(attendanceObj[i][j].date)
                        let each = {studentID:attendanceObj[i][j].userID , type:(attendanceObj[i][j].courseID==0)?'fhb':'cr' , status:'add'}
                        if(each.type == 'fhb') each.subject = attendanceObj[i][j].subject
                        else if(each.type == 'cr') each.subject = (await courseDB.findOne({_id:attendanceObj[i][j].courseID})).subject
                        let findCheckout = checkoutObj[attendanceObj[i][j].date.getHours()].find(check=>{return check.studentID == each.studentID && check.subject == each.subject})
                        if(findCheckout){
                            each.checkout = findCheckout.timestamp
                            each.recheck = findCheckout.recheck
                        }
                        student[attendanceObj[i][j].date.getHours()].push(each)
                    }
                }
            }
            for(let i in student){
                for(let j in student[i]){
                    student[i][j].firstname = studentObj[student[i][j].studentID].firstname
                    student[i][j].nickname = studentObj[student[i][j].studentID].nickname
                    student[i][j].lastname = studentObj[student[i][j].studentID].lastname
                    student[i][j].grade = studentObj[student[i][j].studentID].grade
                    if(student[i][j].checkout === undefined)student[i][j].checkout = null
                    if(student[i][j].recheck === undefined)student[i][j].recheck = false
                }
            }
            res.status(200).send(student)
        } catch (error) {
            res.status(500).send({err:500 , msg:'internal server error'})
        }
    })
}