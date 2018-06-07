module.exports = function (app, db, post, gradeBitToString) {

    var quarterDB = db.collection('quarter');
    var studentHybridDB = db.collection('hybridStudent');
    var studentSkillDB = db.collection('skillStudent');
    var userDB = db.collection('user');
    var courseDB = db.collection('course');

    /**
     * Post method for list student time table
     * req.body = {
     *      year: 2017,
     *      quarter: 1,
     *      studentID: 15999
     * }
     * 
     * if not error
     * res.body = {
     *      course: [
     *          {
     *              courseID: 'awmfmiu40h3qa94gaf94wr42wf',
     *              courseName: 'MS123a',
     *              day: 10000000000,
     *              tutorName: 'Hybrid'
     *          }
     *      ],
     *      hybrid: [
     *          {
     *              courseID: 'awmfmiu40h3qa94gaf94wr42wf',
     *              courseName: 'MS123a',
     *              day: 10000000000,
     *              tutorName: 'Hybrid'
     *          }
     *      ],
     *      skill: [
     *          {
     *              courseID: 'awmfmiu40h3qa94gaf94wr42wf',
     *              courseName: 'MS123a',
     *              day: 10000000000,
     *              tutorName: 'Hybrid'
     *          }
     *      ]
     * }
     */
    post('/post/v1/studentTimeTable', function (req, res) {
        if (req.body.year === undefined || req.body.quarter === undefined || req.body.studentID === undefined) {
            return res.status(400).send({
                err: -1,
                msg: 'Bad Request'
            });
        }
        var studentID = parseInt(req.body.studentID);
        quarterDB.findOne({
            quarter: parseInt(req.body.quarter),
            year: parseInt(req.body.year)
        }).then(quarter => {
            var studentInCourse = courseDB.find({
                quarter: quarter.quarter,
                year: quarter.year,
                student: studentID
            }).toArray();

            var studentInHybrid = studentHybridDB.find({
                quarterID: quarter._id,
                student: {
                    $elemMatch: {
                        studentID: studentID
                    }
                }
            }).toArray();

            var studentInSkill = studentSkillDB.find({
                quarterID: quarter._id,
                student: {
                    $elemMatch: {
                        studentID: studentID
                    }
                }
            }).toArray();

            Promise.all([studentInCourse, studentInHybrid, studentInSkill]).then(values => {
                var response = {};
                var namePromise = [];
                for (let i = 0; i < values.length; i++) {
                    switch (i) {
                        case 0:
                            response.course = [];
                            for (let j = 0; j < values[i].length; j++) {
                                response.course.push({
                                    courseID: values[i][j]._id,
                                    courseName: values[i][j].subject + gradeBitToString(values[i][j].grade) + values[i][j].level,
                                    day: values[i][j].day
                                });
                                namePromise.push(userDB.findOne({
                                    _id: values[i][j].tutor[0]
                                }));
                            }
                            break;
                        case 1:
                            response.hybrid = [];
                            for (let j = 0; j < values[i].length; j++) {
                                for (let k = 0; k < values[i][j].student.length; k++) {
                                    if (studentID == values[i][j].student[k].studentID) {
                                        response.hybrid.push({
                                            hybridID: values[i][j]._id,
                                            subject: values[i][j].student[k].subject,
                                            day: values[i][j].day
                                        });
                                    }
                                }
                            }
                            break;
                        case 2:
                            response.skill = []
                            for (let j = 0; j < values[i].length; j++) {
                                for (let k = 0; k < values[i][j].student.length; k++) {
                                    if (studentID == values[i][j].student[k].studentID) {
                                        response.skill.push({
                                            skillID: values[i][j]._id,
                                            subject: values[i][j].student[k].subject,
                                            day: values[i][j].day
                                        });
                                    }
                                }
                            }
                            break;
                        default:
                            break;
                    }
                }
                Promise.all(namePromise).then(names => {
                    for (let i = 0; i < names.length; i++) {
                        response.course[i].tutorName = names[i].nicknameEn;
                    }
                    res.status(200).send(response);
                });
            });
        })
    });
}