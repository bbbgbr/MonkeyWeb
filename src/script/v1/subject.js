var moment=require("moment");

module.exports = function (app, db, post, gradeBitToString) {

    var quarterDB = db.collection('quarter');
    var studentHybridDB = db.collection('hybridStudent');
    var studentSkillDB = db.collection('skillStudent');
    var userDB = db.collection('user');
    var courseDB = db.collection('course');
    
    /**
     * Post method for list all subject in quarter
     * req.body = {
     *      year: 2017,
     *      quarter: 3
     * }
     * 
     * if not error
     * res.body = {
     *      course: [
     *          {
     *              courseID: '349w7hxtq3un4w9hrt43',
     *              courseName: 'MS123a',
     *              day: 10000000000,
     *              tutorName: 'Hybrid'
     *          },
     *          ...
     *      ]
     * }
     */
    post('/post/v1/listSubjectInQuarter', function (req, res) {
        if (req.body.year === undefined || req.body.quarter === undefined) {
            return res.status(400).send({
                err: -1,
                msg: 'Bad Request'
            });
        }

        var querryQuarterObject = {
            quarter: parseInt(req.body.quarter),
            year: parseInt(req.body.year)
        }

        quarterDB.findOne(querryQuarterObject).then(quarter => {
            var querryObject = {
                quarterID: quarter._id
            };

            if (req.body.day !== undefined) {
                var reqDate = new Date(parseInt(req.body.day));
                querryQuarterObject.day = parseInt(req.body.day);
                querryObject.day = moment(0).day(reqDate.getDay()).hour(reqDate.getHours()).valueOf();
            }

            var subjectInCourse = courseDB.find(querryQuarterObject).toArray();

            var subjectInHybrid = studentHybridDB.find(querryObject).toArray();

            if (querryObject.day !== undefined) {
                var date = new Date(querryObject.day);
                date.setHours(date.getHours() + 2);
                var startTime = querryObject.day;
                delete querryObject.day
                querryObject.day = {
                    $gte: startTime, $lt: date.getTime()
                }
            }

            var subjectInSkill = studentSkillDB.find(querryObject).toArray();

            Promise.all([subjectInCourse, subjectInHybrid, subjectInSkill]).then(values => {
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
                                response.hybrid.push({
                                    hybridID: values[i][j]._id,
                                    day: values[i][j].day
                                });
                            }
                            break;
                        case 2:
                            response.skill = []
                            for (let j = 0; j < values[i].length; j++) {
                                response.skill.push({
                                    skillID: values[i][j]._id,
                                    day: values[i][j].day
                                });
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
        });
    });
}