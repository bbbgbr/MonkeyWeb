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
var gradeBitToArray = function (bit) {
    var output = [];
    for (var i = 0; i < 13; i++) {
        if (bit & (1 << i)) {
            output.push(i + 1);
        }
    }
    return output;
};
module.exports = function (app, db, post, fs, passport, CryptoJS , io) {
    var quarterDB = db.collection('quarter');
    var studentHybridDB = db.collection('hybridStudent');
    var studentSkillDB = db.collection('skillStudent');
    var userDB = db.collection('user');
    var courseDB = db.collection('course');
    var configDB = db.collection('config');
    var auth = require('./auth.js')
    require('./script/v1/quarter.js')(app, db, post);
    require('./script/v1/subject.js')(app, db, post, gradeBitToString);
    require('./script/v1/course.js')(app, db, post, gradeBitToString, gradeBitToArray);
    require('./script/v1/hybrid.js')(app, db, post);
    require('./script/v1/skill.js')(app, db, post);
    require('./script/v1/timetable.js')(app, db, post, gradeBitToString);
    require('./script/v1/room.js')(app, db, post, gradeBitToString);
    require('./script/v1/document.js')(app, db, post);
    require('./script/v1/tutor.js')(app, db, post);
    require('./script/v1/student.js')(app, db, post, gradeBitToString);
    require('./script/v1/user.js')(app, db, post, CryptoJS);
    require('./script/v1/task.js')(app, db, post);
    require('./script/v1/authen.js')(app, db, post, passport);
    require('./script/v1/video.js')(app, db, post, fs);
    require('./script/v1/key.js')(app, db, post, fs);
    require('./script/v1/config.js')(app, db, post, auth);
    require('./script/v1/qr.js')(app, db, post, fs);
    require('./script/v1/transaction.js')(app, db, post , io);
    require('./script/v1/chat.js')(app, db, post);
    require('./script/v1/quota.js')(app, db, post);
    require('./script/v1/checkoutLog.js')(app,db,post,io);
    require('./script/v1/notification.js')(app, db, post);
}