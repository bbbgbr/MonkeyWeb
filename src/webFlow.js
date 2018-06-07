console.log("[START] webFlow.js");
module.exports = function (app, db, pasport) {
    require('typescript-require');
    var ObjectId = require('mongodb').ObjectID;
    var chalk = require("chalk");
    // var cookieParser = require("cookie-parser");
    var moment = require("moment");
    var path = require("path");
    var userDB = db.collection("user");
    var post = app.locals.post;
    var configDB = db.collection("config");
    var quarterDB = db.collection("quarter");
    var auth = require('./auth.js');
    var courseDB = db.collection('course')
    var courseSuggestDB = db.collection('courseSuggestion')
    var hybridDB = db.collection('hybridStudent')
    var skillDB = db.collection('skillStudent')
    var workflowDB = db.collection('workflow')
    var getQuarter = function (year, quarter, callback) {
        if (year === undefined) {
            if (quarter === undefined) quarter = "quarter";
            configDB.findOne({}, function (err, config) {
                if (config.defaultQuarter[quarter]) {
                    quarterDB.findOne({
                        year: config.defaultQuarter[quarter].year,
                        quarter: config.defaultQuarter[quarter].quarter
                    }, function (err, quarter) {
                        if (quarter) {
                            var output = { quarterID: quarter._id };
                            delete quarter._id;
                            Object.assign(output, quarter);
                            callback(null, output);
                        }
                        else callback({ err: "Configuration error occurs." });
                    });
                }
                else callback({ err: "Year is not specified." });
            });
        }
        else {
            if (isFinite(year) && isFinite(quarter)) {
                quarterDB.findOne({
                    year: parseInt(year),
                    quarter: parseInt(quarter)
                }, function (err, quarter) {
                    if (quarter) {
                        var output = { quarterID: quarter._id };
                        delete quarter._id;
                        Object.assign(output, quarter);
                        callback(null, output);
                    }
                    else callback({ err: "Specified year and quarter are not found." });
                });
            }
            else callback({ err: "Year or quarter are not numbers." });
        }
    };
    var logPosition = function (user) {
        if (user) {
            if (user.position == "dev") return chalk.black.bgBlue;
            else if (user.position == "admin") return chalk.black.bgCyan;
            else if (user.position == "tutor") return chalk.black.bgMagenta;
            else return chalk.black.bgGreen;
        }
        else return chalk.black.bgWhite;
    }
    var return404 = function (req, res) {
        if (req.user) {
            let positionColor = logPosition(req.user)
            console.log(chalk.black.bgYellow("[404 REQUEST]", req.method, req.originalUrl, "FROM", req.ip, positionColor("#" + req.cookies.monkeyWebUser), moment().format("@ dddDDMMMYYYY HH:mm:ss")));
            console.log("\treq.body", "=>", req.body);
            res.status(404).sendFile(path.join(__dirname, "../old/404.html"));
        } else {
            console.log(chalk.black.bgYellow("[404 REQUEST]", req.method, req.originalUrl, "FROM", req.ip, moment().format("@ dddDDMMMYYYY HH:mm:ss")));
            console.log("\treq.body", "=>", req.body);
            res.status(404).sendFile(path.join(__dirname, "../old/404.html"));
        }
    };

    app.use('/dev', require('./script/dev/index')(auth, db));
    app.use('/v2', require('./script/v2/index.ts').app(auth));
    app.get('*', function (req, res, next) {
        if (req.url == '/login') req.logOut();
        if (req.isAuthenticated()) {
            let positionColor = logPosition(req.user);
            console.log(chalk.black.bgGreen("[GET REQUEST]"), req.url, "FROM", req.ip, positionColor("#" + req.user._id), moment().format("@ dddDDMMMYYYY HH:mm:ss"));
            res.cookie('monkeyWebUser', '' + req.user._id)
            res.cookie('monkeyWebPassword', req.user.password)
        } else {
            console.log(chalk.black.bgGreen("[GET REQUEST]"), req.url, "FROM", req.ip, moment().format("@ dddDDMMMYYYY HH:mm:ss"));
        }
        next()
    })
    app.get('/test', function (req, res) {
        res.status(200).render('test', {})
    })
    app.get('/react', function (req, res) {
        res.status(200).render('reactPage', {})
    })
    app.get('/', async function (req, res) {
        if (req.isAuthenticated()) {
            let local = {
                webUser: {
                    userID: parseInt(req.user._id),
                    firstname: req.user.firstname,
                    lastname: req.user.lastname,
                    position: req.user.position
                },
                config: await configDB.findOne({})
            }
            if (req.user.position == 'student') {
                if (req.user.student.status == 'active') {
                    let config = await configDB.findOne({ _id: "config" })
                    for (let i in req.user.student.quarter)
                        if (req.user.student.quarter[i].year == config.defaultQuarter.registration.year
                            && req.user.student.quarter[i].quarter == config.defaultQuarter.registration.quarter) {
                            if ("untransferred" == req.user.student.quarter[i].registrationState)
                                return res.redirect('/regisPage')
                        }
                    return res.status(200).render('home', local);
                }
                if (req.user.student.status == 'inactive') return res.status(200).render('registrationName', local);
            }
            else return res.status(200).render('adminHome', local);
        }
        return res.redirect('/login')
    })

    /*  *********************************************************************************************************
        *********** home , registrationReceipt , registrationName are handled in get '/' above ******************
        *********************************************************************************************************

        addPugPage(pageURL,side,permission,localObject)
    
        - pageURL can be aaaa/bbbb/cccc/dddd which return pug page "dddd"(the last one by spliting slash)
        - side can be "staff" or "student"
        - permission
            -for staff , bigger or equal position can access this page
            -for student , permission have to be an object with status , state , quarter
                do not check if field is undefined
        - localObject is an object that will pass to pug page or can be a function which return promise that resolve to object
    */
    app.get('/adminChat', function (req, res) { return res.status(200).render('adminChat') })
    app.get('/login', function (req, res) {
        return res.status(200).render('login')
    })
    app.get('/studentDocument', auth.isLoggedIn, async function (req, res) {
        console.log(req.query)
        let local = {
            webUser: {
                userID: parseInt(req.user._id),
                firstname: req.user.firstname,
                lastname: req.user.lastname,
                position: req.user.position
            },
            config: await configDB.findOne({})
        }
        return res.status(200).render('studentDocument', local)
    })
    app.get("/studentProfile", auth.isLoggedIn, async function (req, res) {
        let local = {
            webUser: {
                userID: parseInt(req.user._id),
                firstname: req.user.firstname,
                lastname: req.user.lastname,
                position: req.user.position
            },
            config: await configDB.findOne({})
        }
        if (auth.authorize(req.user, 'student', { status: 'active' }, local.config)) return res.status(200).render('studentProfile', local)
        else return404(req, res)
    })
    app.get("/summerAbsentForm", auth.isLoggedIn, async function (req, res) {
        let local = {
            webUser: {
                userID: parseInt(req.user._id),
                firstname: req.user.firstname,
                lastname: req.user.lastname,
                position: req.user.position
            },
            config: await configDB.findOne({})
        }
        if (auth.authorize(req.user, 'student', { status: 'active' }, local.config)) return res.status(200).render('summerAbsentForm', local)
        else return404(req, res)
    })
    app.get("/absentAgreeForm", auth.isLoggedIn, async function (req, res) {
        let local = {
            webUser: {
                userID: parseInt(req.user._id),
                firstname: req.user.firstname,
                lastname: req.user.lastname,
                position: req.user.position
            },
            config: await configDB.findOne({})
        }
        if (auth.authorize(req.user, 'student', { status: 'active', state: 'finished' }, local.config)) return res.status(200).render('absentAgreeForm', local)
        else return404(req, res)
    })
    app.get("/absentForm", auth.isLoggedIn, async function (req, res) {
        let local = {
            webUser: {
                userID: parseInt(req.user._id),
                firstname: req.user.firstname,
                lastname: req.user.lastname,
                position: req.user.position
            },
            config: await configDB.findOne({})
        }
        if (auth.authorize(req.user, 'student', { status: 'active', state: 'finished' }, local.config)) return res.status(200).render('absentForm', local)
        else return404(req, res)
    })
    app.get("/addForm", auth.isLoggedIn, async function (req, res) {
        let local = {
            webUser: {
                userID: parseInt(req.user._id),
                firstname: req.user.firstname,
                lastname: req.user.lastname,
                position: req.user.position
            },
            config: await configDB.findOne({})
        }
        if (auth.authorize(req.user, 'student', { status: 'active', state: 'finished' }, local.config)) return res.status(200).render('addForm', local)
        else return404(req, res)
    })
    app.get("/addAgreeForm", auth.isLoggedIn, async function (req, res) {
        let local = {
            webUser: {
                userID: parseInt(req.user._id),
                firstname: req.user.firstname,
                lastname: req.user.lastname,
                position: req.user.position
            },
            config: await configDB.findOne({})
        }
        if (auth.authorize(req.user, 'student', { status: 'active', state: 'finished' }, local.config)) return res.status(200).render('addAgreeForm', local)
        else return404(req, res)
    })
    app.get("/permanentAdtendance", auth.isLoggedIn, async function (req, res) {
        let local = {
            webUser: {
                userID: parseInt(req.user._id),
                firstname: req.user.firstname,
                lastname: req.user.lastname,
                position: req.user.position
            },
            config: await configDB.findOne({})
        }
        if (auth.authorize(req.user, 'student', { status: 'active', state: 'finished' }, local.config)) return res.status(200).render('permanentAdtendance', local)
        else return404(req, res)
    })
    app.get("/regisPage", auth.isLoggedIn, async function (req, res) {
        let local = {
            webUser: {
                userID: parseInt(req.user._id),
                nickname: req.user.nickname,
                firstname: req.user.firstname,
                lastname: req.user.lastname,
                position: req.user.position,
                grade: req.user.student.grade,
                level: req.user.level
            },
            config: await configDB.findOne({})
        }
        if (auth.authorize(req.user, 'student', { status: 'active', state: "untransferred" }, local.config)) {
            try {
                local.courseNumber = (await courseDB.find({
                    quarter: local.config.defaultQuarter.registration.quarter,
                    year: local.config.defaultQuarter.registration.year,
                    student: parseInt(req.user._id),
                }).toArray()).length
                local.qname = (await quarterDB.findOne({
                    quarter: local.config.defaultQuarter.registration.quarter,
                    year: local.config.defaultQuarter.registration.year
                })).name
                return res.status(200).render('registrationReceipt', local)
            } catch (error) {
                return return404(req, res)
            }
        }
        if (auth.authorize(req.user, 'student', { status: 'active', state: ["unregistered", "rejected"] }, local.config)) {
            // Prepare data
            if (local.config.defaultQuarter.registration.quarter < 10) {
                // convert gradeBit to gradeStr
                const gradeBitToString = function (bit) {
                    var output = "", p = false, s = false;
                    for (var i = 0; i < 6; i++) {
                        if (bit & (1 << i)) {
                            if (p == false) {
                                p = true;
                                output += "P";
                            }
                            output += (i + 1);
                        }
                    }
                    for (var i = 0; i < 6; i++) {
                        if (bit & (1 << (i + 6))) {
                            if (s == false) {
                                s = true;
                                output += "S";
                            }
                            output += (i + 1);
                        }
                    }
                    if (bit & (1 << 12)) output += "SAT";
                    return output;
                };
                // convert gradeBit to grade arr
                const gradeBitToArray = function (bit) {
                    var output = [];
                    for (var i = 0; i < 13; i++) {
                        if (bit & (1 << i)) {
                            output.push(i + 1);
                        }
                    }
                    return output;
                };
                // convert str to array
                const strToArray = (str) => {
                    return str.split(',');
                };
                let regisYear = local.config.defaultQuarter.registration.year;
                let regisQ = local.config.defaultQuarter.registration.quarter;
                let stdGrade = req.user.level.slice(0, -1);
                switch (req.query.page) {
                    case '1':
                        // special method for cr page
                        local.thisPage = 1;
                        let allCr = await courseDB.find(
                            { 'year': regisYear, 'quarter': regisQ },
                            { 'student': 0, 'submission': 0, 'room': 0, 'year': 0, 'quarter': 0 }
                        ).toArray();
                        allCr = allCr.filter((a) => {
                            if (gradeBitToArray(a.grade).findIndex(x => x == parseInt(stdGrade)) > -1) return true;
                            return false;
                        });
                        let tutorInfo = [];
                        for (let i in allCr) {
                            tutorInfo.push(userDB.findOne({ '_id': allCr[i].tutor[0] }, { 'nicknameEn': 1 }));
                        }
                        let tutor = await Promise.all(tutorInfo);
                        for (let i in allCr) {
                            allCr[i].courseName = allCr[i].subject + gradeBitToString(allCr[i].grade) + allCr[i].level;
                            allCr[i].tutorName = tutor[i].nicknameEn;
                            allCr[i].grade = gradeBitToArray(allCr[i].grade)
                        }
                        local.allCr = allCr;
                        let crSugg = await courseSuggestDB.findOne(
                            { 'year': regisYear, 'quarter': regisQ, 'level': req.user.level.slice(-1), 'grade': parseInt(stdGrade) },
                            { 'courseID': 1 }
                        );
                        local.suggCr = crSugg;
                        break;
                    case '4':
                        // general method for sk data
                        if (req.query.cr == undefined) return res.redirect('/regisPage?page=1');
                        if (req.query.sk != undefined) {
                            let sk = strToArray(req.query.sk);
                            let skInfoPromise = [];
                            for (let i in sk) {
                                let str = sk[i].slice(0, -1);
                                skInfoPromise.push(skillDB.findOne({ '_id': ObjectId(str) }, { 'day': 1 }));
                            }
                            let skInfo = await Promise.all(skInfoPromise);
                            for (let i in skInfo) {
                                skInfo[i].subj = sk[i].slice(-1);
                            }
                            local.allSk = skInfo;
                            console.log(skInfo);
                        }
                        // special method for submit page
                        if (req.query.page == '4') {
                            local.thisPage = 4;
                        }
                    case '3':
                        // general method for fhb data
                        if (req.query.cr == undefined) return res.redirect('/regisPage?page=1');
                        if (req.query.fhb != undefined) {
                            let hb = strToArray(req.query.fhb);
                            let hbInfoPromise = [];
                            for (let i in hb) {
                                let str = hb[i].slice(0, -1);
                                hbInfoPromise.push(hybridDB.findOne({ '_id': ObjectId(str) }, { 'day': 1 }));
                            }
                            let hbInfo = await Promise.all(hbInfoPromise);
                            for (let i in hbInfo) {
                                hbInfo[i].subj = hb[i].slice(-1);
                            }
                            local.allHB = hbInfo;
                        }
                        // special method for skill page
                        if (req.query.page == '3') {
                            local.thisPage = 3;
                            let allSk = await skillDB.find({ 'quarterID': regisYear + '' + ((regisQ > 9) ? regisQ : '0' + regisQ) }, { 'day': 1 }).sort({ 'day': 1 }).toArray();
                            local.allSk = allSk;
                        }
                    case '2':
                        // general method for cr data
                        if (req.query.cr == undefined) return res.redirect('/regisPage?page=1');
                        let cr = strToArray(req.query.cr);
                        let crInfoPromise = [];
                        for (let i in cr) {
                            crInfoPromise.push(courseDB.findOne(
                                { '_id': cr[i] },
                                { 'student': 0, 'submission': 0, 'room': 0, 'year': 0, 'quarter': 0 }
                            ));
                        }
                        let crInfo = await Promise.all(crInfoPromise);
                        let tutorInfo2 = [];
                        for (let i in crInfo) {
                            tutorInfo2.push(userDB.findOne({ '_id': crInfo[i].tutor[0] }, { 'nicknameEn': 1 }));
                        }
                        let tutor2 = await Promise.all(tutorInfo2);
                        for (let i in crInfo) {
                            crInfo[i].courseName = crInfo[i].subject + gradeBitToString(crInfo[i].grade) + crInfo[i].level;
                            crInfo[i].tutorName = tutor2[i].nicknameEn;
                            crInfo[i].grade = gradeBitToArray(crInfo[i].grade)
                        }
                        local.allCr = crInfo;
                        // special method for fhb page
                        if (req.query.page == '2') {
                            local.thisPage = 2;
                            let allHB = await hybridDB.find({ 'quarterID': regisYear + '' + ((regisQ > 9) ? regisQ : '0' + regisQ) }, { 'day': 1 }).toArray();
                            local.allHB = allHB;
                        }
                        break;
                    default:
                        break;
                }
            }
            if (local.config.allowRegistration) {
                if (local.config.defaultQuarter.registration.quarter > 10) return res.status(200).render('registrationSummer', local)
                return res.status(200).render('regisPage', local)
            } else if (req.cookies.vid && req.cookies.vpw) {
                try {
                    let user = await userDB.findOne({ _id: parseInt(req.cookies.vid), password: req.cookies.vpw })
                    if (user.position && user.position != 'student') {
                        if (local.config.defaultQuarter.registration.quarter > 10) return res.status(200).render('registrationSummer', local)
                        return res.status(200).render('regisPage', local)
                    }
                    else res.status(200).render('verifyRegisUser', local)
                } catch (error) {
                    return return404(req, res)
                }
            } else res.status(200).render('verifyRegisUser', local)
        } else return404(req, res)
    })
    app.get("/registrationSummer", auth.isLoggedIn, async function (req, res) {
        return res.redirect('/regisPage')
    })
    app.get("/registrationReceipt", auth.isLoggedIn, function (req, res) {
        return res.redirect('/regisPage')
    })
    app.get("/summerReceipt", auth.isLoggedIn, function (req, res) {
        return res.redirect('/regisPage')
    })
    app.get("/adminHome", auth.isLoggedIn, async function (req, res) {
        let local = {
            webUser: {
                userID: parseInt(req.user._id),
                firstname: req.user.firstname,
                lastname: req.user.lastname,
                position: req.user.position
            },
            config: await configDB.findOne({})
        }
        if (auth.authorize(req.user, 'staff', 'tutor', local.config)) return res.status(200).render('adminHome', local)
        else return404(req, res)
    })
    app.get('/adminChat', function (req, res) {
        console.log(req.query)
        return res.status(200).render('adminChat')
    })
    app.get("/adminAllcourse", auth.isLoggedIn, async function (req, res) {
        let local = {
            webUser: {
                userID: parseInt(req.user._id),
                firstname: req.user.firstname,
                lastname: req.user.lastname,
                position: req.user.position
            }
        };
        let [config, tutor] = await Promise.all([
            configDB.findOne({}),
            userDB.find({
                position: {
                    $in: ['tutor', 'admin', 'dev']
                },
                'tutor.status': 'active'
            }, {
                    sort: {
                        _id: 1
                    }
                }).toArray()
        ]);
        local.config = config;
        local.tutor = tutor;
        if (auth.authorize(req.user, 'staff', 'tutor', local.config)) return res.status(200).render('adminAllcourse', local)
        else return404(req, res)
    })
    app.get("/adminCoursedescription", auth.isLoggedIn, async function (req, res) {
        let local = {
            webUser: {
                userID: parseInt(req.user._id),
                firstname: req.user.firstname,
                lastname: req.user.lastname,
                position: req.user.position
            },
            config: await configDB.findOne({})
        }
        if (auth.authorize(req.user, 'staff', 'tutor', local.config)) return res.status(200).render('adminCoursedescription', local)
        else return404(req, res)
    })
    app.get("/adminAllHybrid", auth.isLoggedIn, async function (req, res) {
        let [config, allQ] = await Promise.all([
            configDB.findOne({}),
            quarterDB.find({}, { year: 1, quarter: 1, name: 1 }).sort({ _id: 1 }).toArray()
        ]);
        let year;
        let quarter;
        if (req.cookies.monkeyWebSelectedQuarter === undefined) {
            year = config.defaultQuarter.quarter.year;
            quarter = config.defaultQuarter.quarter.quarter;
        } else {
            year = parseInt(req.cookies.monkeyWebSelectedQuarter.slice(0, 4));
            quarter = parseInt(req.cookies.monkeyWebSelectedQuarter.slice(5));
        }
        let selectedQ = year + '-' + quarter;
        let allHb = await hybridDB.find({
            quarterID: year + ((quarter < 10) ? '0' + quarter : '' + quarter)
        }).sort({ day: 1 }).toArray();
        let newAllHb = [];
        for (let i in allHb) {
            let math = 0;
            let phy = 0;
            let chem = 0;
            let eng = 0;
            let t = moment(allHb[i].day).format('dddd HH:mm');
            for (let j in allHb[i].student) {
                if (allHb[i].student[j].subject.toLowerCase() === 'm') {
                    math += 1;
                } else if (allHb[i].student[j].subject.toLowerCase() === 'p') {
                    phy += 1;
                } else if (allHb[i].student[j].subject.toLowerCase() === 'c') {
                    chem += 1;
                } else if (allHb[i].student[j].subject.toLowerCase() === 'e') {
                    eng += 1;
                }
            }
            newAllHb.push({
                ID: allHb[i]._id,
                day: t,
                student: math,
                subject: 'M'
            });
            newAllHb.push({
                ID: allHb[i]._id,
                day: t,
                student: phy,
                subject: 'P'
            });
            newAllHb.push({
                ID: allHb[i]._id,
                day: t,
                student: chem,
                subject: 'C'
            });
            newAllHb.push({
                ID: allHb[i]._id,
                day: t,
                student: eng,
                subject: 'E'
            });
        }
        let local = {
            webUser: {
                userID: parseInt(req.user._id),
                firstname: req.user.firstname,
                lastname: req.user.lastname,
                position: req.user.position
            },
            config: config,
            quarterList: allQ,
            selectedQuarter: selectedQ,
            hybridList: newAllHb
        }
        if (auth.authorize(req.user, 'staff', 'tutor', local.config)) return res.status(200).render('adminAllHybrid', local)
        else return404(req, res)
    })
    app.get("/adminHybridInfo", auth.isLoggedIn, async function (req, res) {
        let local = {
            webUser: {
                userID: parseInt(req.user._id),
                firstname: req.user.firstname,
                lastname: req.user.lastname,
                position: req.user.position
            },
            config: await configDB.findOne({})
        }
        if (auth.authorize(req.user, 'staff', 'tutor', local.config)) return res.status(200).render('adminHybridInfo', local)
        else return404(req, res)
    })
    app.get("/adminAllskill", auth.isLoggedIn, async function (req, res) {
        let [config, allQ] = await Promise.all([
            configDB.findOne({}),
            quarterDB.find({}, { year: 1, quarter: 1, name: 1 }).sort({ _id: 1 }).toArray()
        ]);
        let year;
        let quarter;
        if (req.cookies.monkeyWebSelectedQuarter === undefined) {
            year = config.defaultQuarter.quarter.year;
            quarter = config.defaultQuarter.quarter.quarter;
        } else {
            year = parseInt(req.cookies.monkeyWebSelectedQuarter.slice(0, 4));
            quarter = parseInt(req.cookies.monkeyWebSelectedQuarter.slice(5));
        }
        let selectedQ = year + '-' + quarter;
        let allSk = await skillDB.find({
            quarterID: year + ((quarter < 10) ? '0' + quarter : '' + quarter)
        }).sort({ day: 1 }).toArray();
        let newAllSk = [];
        for (let i in allSk) {
            let math = 0;
            let eng = 0;
            let t = moment(allSk[i].day).format('dddd HH:mm');
            for (let j in allSk[i].student) {
                if (allSk[i].student[j].subject.toLowerCase() === 'm') {
                    math += 1;
                } else if (allSk[i].student[j].subject.toLowerCase() === 'e') {
                    eng += 1;
                } else {
                    math += 1;
                    eng += 1;
                }
            }
            newAllSk.push({
                ID: allSk[i]._id,
                day: t,
                student: math,
                subject: 'M'
            });
            newAllSk.push({
                ID: allSk[i]._id,
                day: t,
                student: eng,
                subject: 'E'
            });
        }
        let local = {
            webUser: {
                userID: parseInt(req.user._id),
                firstname: req.user.firstname,
                lastname: req.user.lastname,
                position: req.user.position
            },
            config: config,
            quarterList: allQ,
            selectedQuarter: selectedQ,
            skillList: newAllSk
        }
        if (auth.authorize(req.user, 'staff', 'tutor', local.config)) return res.status(200).render('adminAllskill', local)
        else return404(req, res)
    })
    app.get("/adminSkillInfo", auth.isLoggedIn, async function (req, res) {
        let config;
        let skInfo;
        if (req.cookies.monkeySelectedSkill === undefined) {
            res.redirect('/adminAllskill');
        } else {
            let skID = req.cookies.monkeySelectedSkill.slice(0, -1);
            [config, skInfo] = await Promise.all([
                configDB.findOne({}),
                skillDB.findOne({ _id: ObjectId(skID) })
            ]);
        }
        let promise1 = [];
        let promise2 = [];
        let promise3 = [];
        let year;
        let quarter;
        if (req.cookies.monkeyWebSelectedQuarter === undefined) {
            year = config.defaultQuarter.quarter.year;
            quarter = config.defaultQuarter.quarter.quarter;
        } else {
            year = parseInt(req.cookies.monkeyWebSelectedQuarter.slice(0, 4));
            quarter = parseInt(req.cookies.monkeyWebSelectedQuarter.slice(5));
        }
        for (let i in skInfo.student) {
            if (skInfo.student[i].subject === "ME" || skInfo.student[i].subject === req.cookies.monkeySelectedSkill.slice(-1)) {
                promise1.push(userDB.findOne({ _id: skInfo.student[i].studentID, position: 'student' }, {
                    nickname: 1,
                    firstname: 1,
                    'student.grade': 1,
                    'student.status': 1,
                }));
                promise2.push(courseDB.findOne({
                    year: year,
                    quarter: quarter,
                    student: skInfo.student[i].studentID
                }, { _id: 1 }));
                promise3.push(hybridDB.findOne({
                    quarterID: year + '' + ((quarter > 10) ? quarter : '0' + quarter),
                    student: { $elemMatch: { studentID: skInfo.student[i].studentID } }
                }, { _id: 1 }))
            }
        }
        let [userInfo, crInfo, hbInfo] = await Promise.all([
            Promise.all(promise1),
            Promise.all(promise2),
            Promise.all(promise3)
        ]);
        console.log(userInfo);
        let skStd = [];
        for (let i = 0; i < userInfo.length; i++) {
            if (userInfo[i].student.status == "active") {
                skStd.push({
                    grade: userInfo[i].student.grade,
                    hasCR: (crInfo[i] === null ? false : true),
                    hasHB: (hbInfo[i] === null ? false : true),
                    _id: userInfo[i]._id,
                    firstname: userInfo[i].firstname,
                    nickname: userInfo[i].nickname
                });
            }
        }
        let local = {
            webUser: {
                userID: parseInt(req.user._id),
                firstname: req.user.firstname,
                lastname: req.user.lastname,
                position: req.user.position
            },
            config: config,
            skInfo: {
                skillID: skInfo._id,
                subject: req.cookies.monkeySelectedSkill.slice(-1),
                day: moment(skInfo.day).format('dddd HH:mm')
            },
            skStd: skStd
        }
        if (auth.authorize(req.user, 'staff', 'tutor', local.config)) return res.status(200).render('adminSkillInfo', local)
        else return404(req, res)
    })
    app.get("/tutorCommentStudent", auth.isLoggedIn, async function (req, res) {
        let local = {
            webUser: {
                userID: parseInt(req.user._id),
                firstname: req.user.firstname,
                lastname: req.user.lastname,
                position: req.user.position
            },
            config: await configDB.findOne({})
        }
        if (auth.authorize(req.user, 'staff', 'tutor', local.config)) return res.status(200).render('tutorCommentStudent', local)
        else return404(req, res)
    })
    app.get("/tutorEditProfile", auth.isLoggedIn, async function (req, res) {
        let email = await userDB.findOne({ _id: parseInt(req.user._id) }, { email: 1 });
        let local = {
            webUser: {
                userID: parseInt(req.user._id),
                firstname: req.user.firstname,
                lastname: req.user.lastname,
                position: req.user.position
            },
            config: await configDB.findOne({}),
            email: email.email
        }
        if (auth.authorize(req.user, 'staff', 'tutor', local.config)) return res.status(200).render('tutorEditProfile', local)
        else return404(req, res)
    })
    app.get("/adminStudentAttendanceModifier", auth.isLoggedIn, async function (req, res) {
        let local = {
            webUser: {
                userID: parseInt(req.user._id),
                firstname: req.user.firstname,
                lastname: req.user.lastname,
                position: req.user.position
            },
            config: await configDB.findOne({}),
        }
        if (auth.authorize(req.user, 'staff', 'tutor', local.config)) return res.status(200).render('adminStudentAttendanceModifier', local)
        else return404(req, res)
    })
    app.get("/tutorCheckInHistory", auth.isLoggedIn, async function (req, res) {
        let local = {
            webUser: {
                userID: parseInt(req.user._id),
                firstname: req.user.firstname,
                lastname: req.user.lastname,
                position: req.user.position
            },
            config: await configDB.findOne({})
        }
        if (auth.authorize(req.user, 'staff', 'tutor', local.config)) return res.status(200).render('tutorCheckInHistory', local)
        else return404(req, res)
    })
    app.get("/tutorCheckInActivity", auth.isLoggedIn, async function (req, res) {
        let local = {
            webUser: {
                userID: parseInt(req.user._id),
                firstname: req.user.firstname,
                lastname: req.user.lastname,
                position: req.user.position
            },
            config: await configDB.findOne({})
        }
        if (auth.authorize(req.user, 'staff', 'tutor', local.config)) return res.status(200).render('tutorCheckInActivity', local)
        else return404(req, res)
    })
    app.get("/tutorCheck", auth.isLoggedIn, async function (req, res) {
        let local = {
            webUser: {
                userID: parseInt(req.user._id),
                firstname: req.user.firstname,
                lastname: req.user.lastname,
                position: req.user.position
            },
            config: await configDB.findOne({})
        }
        if (auth.authorize(req.user, 'staff', 'tutor', local.config)) return res.status(200).render('tutorCheck', local)
        else return404(req, res)
    })
    app.get("/workflow", auth.isLoggedIn, async function (req, res) {
        let local = {
            webUser: {
                userID: parseInt(req.user._id),
                firstname: req.user.firstname,
                lastname: req.user.lastname,
                position: req.user.position
            },
            config: await configDB.findOne({})
        }
        if (auth.authorize(req.user, 'staff', 'tutor', local.config)) return res.status(200).render('adminWorkflow', local)
        else return404(req, res)
    })
    app.get("/tutorCourseMaterial", auth.isLoggedIn, async function (req, res) {
        let local = {
            webUser: {
                userID: parseInt(req.user._id),
                firstname: req.user.firstname,
                lastname: req.user.lastname,
                position: req.user.position
            },
            config: await configDB.findOne({})
        }
        if (auth.authorize(req.user, 'staff', 'tutor', local.config)) {
            local.moment = moment;
            getQuarter(req.query.year, req.query.quarter, function (err, quarter) {
                if (err) res.send(err);
                else {
                    Object.assign(local, { quarter: quarter });
                    post("post/allCourseMaterial", { year: quarter.year, quarter: quarter.quarter }, function (result) {
                        Object.assign(local, result);
                        post("post/getConfig", {}, function (result) {
                            Object.assign(local, { config: result });
                            post("post/listQuarter", { status: "protected" }, function (result) {
                                Object.assign(local, { protectedQuarter: result.quarter });
                                res.status(200).render('tutorCourseMaterial', local);
                            });
                        });
                    });
                }
            });
        }
        else return404(req, res)
    })
    app.get("/adminCalendar", auth.isLoggedIn, async function (req, res) {
        let local = {
            webUser: {
                userID: parseInt(req.user._id),
                firstname: req.user.firstname,
                lastname: req.user.lastname,
                position: req.user.position
            },
            config: await configDB.findOne({})
        }
        if (auth.authorize(req.user, 'staff', 'tutor', local.config)) return res.status(200).render('adminCalendar', local)
        else return404(req, res)
    })
    app.get("/tutorQrGenerator", auth.isLoggedIn, async function (req, res) {
        let local = {
            webUser: {
                userID: parseInt(req.user._id),
                firstname: req.user.firstname,
                lastname: req.user.lastname,
                position: req.user.position
            },
            config: await configDB.findOne({})
        }
        if (auth.authorize(req.user, 'staff', 'tutor', local.config)) return res.status(200).render('tutorQrGenerator', local)
        else return404(req, res)
    })
    app.get("/testAdmin", auth.isLoggedIn, async function (req, res) {
        let local = {
            webUser: {
                userID: parseInt(req.user._id),
                firstname: req.user.firstname,
                lastname: req.user.lastname,
                position: req.user.position
            },
            config: await configDB.findOne({})
        }
        if (auth.authorize(req.user, 'staff', 'admin', local.config)) return res.status(200).render('testAdmin', local)
        else return404(req, res)
    })
    app.get("/adminAllstudent", auth.isLoggedIn, async function (req, res) {
        let local = {
            webUser: {
                userID: parseInt(req.user._id),
                firstname: req.user.firstname,
                lastname: req.user.lastname,
                position: req.user.position
            },
            config: await configDB.findOne({})
        }
        if (auth.authorize(req.user, 'staff', 'admin', local.config)) return res.status(200).render('adminAllstudent', local)
        else return404(req, res)
    })
    app.get("/adminStudentProfileQ4", auth.isLoggedIn, async function (req, res) {
        let local = {
            webUser: {
                userID: parseInt(req.user._id),
                firstname: req.user.firstname,
                lastname: req.user.lastname,
                position: req.user.position
            },
            config: await configDB.findOne({})
        }
        if (auth.authorize(req.user, 'staff', 'admin', local.config)) return res.status(200).render('adminStudentProfileQ4', local)
        else return404(req, res)
    })
    app.get("/adminConference", auth.isLoggedIn, async function (req, res) {
        let local = {
            webUser: {
                userID: parseInt(req.user._id),
                firstname: req.user.firstname,
                lastname: req.user.lastname,
                position: req.user.position
            },
            config: await configDB.findOne({})
        }
        if (auth.authorize(req.user, 'staff', 'admin', local.config)) return res.status(200).render('adminConference', local)
        else return404(req, res)
    })
    app.get("/adminCourseRoom", auth.isLoggedIn, async function (req, res) {
        let local = {
            webUser: {
                userID: parseInt(req.user._id),
                firstname: req.user.firstname,
                lastname: req.user.lastname,
                position: req.user.position
            },
            config: await configDB.findOne({})
        }
        if (auth.authorize(req.user, 'staff', 'admin', local.config)) return res.status(200).render('adminCourseRoom', local)
        else return404(req, res)
    })
    app.get("/adminCourseTable", auth.isLoggedIn, async function (req, res) {
        let local = {
            webUser: {
                userID: parseInt(req.user._id),
                firstname: req.user.firstname,
                lastname: req.user.lastname,
                position: req.user.position
            },
            config: await configDB.findOne({})
        }
        if (auth.authorize(req.user, 'staff', 'admin', local.config)) return res.status(200).render('adminCourseTable', local)
        else return404(req, res)
    })
    app.get("/adminStudentprofile", auth.isLoggedIn, async function (req, res) {
        let local = {
            webUser: {
                userID: parseInt(req.user._id),
                firstname: req.user.firstname,
                lastname: req.user.lastname,
                position: req.user.position
            },
            config: await configDB.findOne({})
        }
        if (auth.authorize(req.user, 'staff', 'admin', local.config)) return res.status(200).render('adminStudentprofile', local)
        else return404(req, res)
    })
    app.get("/adminCourseMaterial", auth.isLoggedIn, async function (req, res) {
        let local = {
            webUser: {
                userID: parseInt(req.user._id),
                firstname: req.user.firstname,
                lastname: req.user.lastname,
                position: req.user.position
            },
            config: await configDB.findOne({})
        }
        if (auth.authorize(req.user, 'staff', 'tutor', local.config)) {
            local.moment = moment;
            getQuarter(req.query.year, req.query.quarter, function (err, quarter) {
                if (err) res.send(err);
                else {
                    Object.assign(local, { quarter: quarter });
                    post("post/allCourseMaterial", { year: quarter.year, quarter: quarter.quarter }, function (result) {
                        Object.assign(local, result);
                        post("post/getConfig", {}, function (result) {
                            Object.assign(local, { config: result });
                            post("post/listQuarter", { status: "protected" }, function (result) {
                                Object.assign(local, { protectedQuarter: result.quarter });
                                res.status(200).render('adminCourseMaterial', local);
                            });
                        });
                    });
                }
            });
        }
        else return404(req, res)
    })
    app.get("/checkInSummary", auth.isLoggedIn, async function (req, res) {
        let local = {
            webUser: {
                userID: parseInt(req.user._id),
                firstname: req.user.firstname,
                lastname: req.user.lastname,
                position: req.user.position
            },
            config: await configDB.findOne({})
        }
        if (auth.authorize(req.user, 'staff', 'mel', local.config)) return res.status(200).render('checkInSummary', local)
        else return404(req, res)
    })
    app.get("/testDev", auth.isLoggedIn, async function (req, res) {
        let local = {
            webUser: {
                userID: parseInt(req.user._id),
                firstname: req.user.firstname,
                lastname: req.user.lastname,
                position: req.user.position
            },
            config: await configDB.findOne({})
        }
        if (auth.authorize(req.user, 'staff', 'dev', local.config)) {
            local.moment = moment
            post("post/allCourse", { quarter: "all" }, function (result) {
                Object.assign(local, result);
                userDB.find({ position: { $ne: "student" } }).sort({ _id: 1 }).toArray(function (err, result) {
                    Object.assign(local, { tutor: result });
                    return res.status(200).render('testDev', local)
                });
            });

        }
        else return404(req, res)
    })
    app.all("*", return404);
}


