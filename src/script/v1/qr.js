module.exports = function (app, db, post, fs) {

    var isDevelopOnMac = !/^win/.test(process.platform);

    const KEY_PATH = (isDevelopOnMac) ? '/Volumes/KEY-QRCODE/' : 'file://monkeycloud/key-qrcode/';
    const KEY_STUDENT_PATH = (isDevelopOnMac) ? '/Volumes/KEY-STUDENT/' : 'file://monkeycloud/key-student/';
    const SUBJECT_CONST = {
        'M': 'MATH',
        'P': 'PHYSICS',
        'C': 'CHEMISTRY',
        'E': 'ENGLISH'
    };
    const KEY_FILE_SET = [
        'HWKEY',
        'SKILLKEY',
        'TESTKEY'
    ];
    const STUDENT_FILE_SET = [
        'HOTKEY'
    ];

    post('/post/v1/requestQR', function (req, res) {
        if (!(req.body.subject && req.body.ageGroup && req.body.level && req.body.difficulty && req.body.number && req.body.rev && req.body.subRev)) {
            return res.status(400).send({
                err: -1,
                msg: 'Bad Reqeust'
            });
        }
        var keyPath = '';
        keyPath += SUBJECT_CONST[req.body.subject] + '/';
        var subjectLevel = req.body.subject + req.body.ageGroup + '-' + req.body.level;
        keyPath += subjectLevel + '/';
        keyPath += subjectLevel + '(REV' + req.body.rev + ')/';
        keyPath += subjectLevel + req.body.difficulty + req.body.number + '/';
        keyPath += subjectLevel + req.body.difficulty + req.body.number;
        var rev = '(REV' + req.body.rev + '_' + req.body.subRev + ').pdf';
        if (req.body.alternative) {
            keyPath += req.body.alternative;
            if (req.body.supplement) {
                keyPath += req.body.supplement;
            }
        }
        var keyObject = {
            hw: KEY_PATH + keyPath + KEY_FILE_SET[0],
            skill: KEY_PATH + keyPath + KEY_FILE_SET[1],
            test: KEY_PATH + keyPath + KEY_FILE_SET[2],
            hot: KEY_STUDENT_PATH + keyPath + STUDENT_FILE_SET[0]
        };
        for (const key in keyObject) {
            keyObject[key] += rev;
            var dir = keyObject[key];
            if (!isDevelopOnMac) {
                dir = dir.replace('file://monkeycloud/key-qrcode/', 'W://');
                dir = dir.replace('file://monkeycloud/key-student/', 'V://');
            }
            fs.ensureFileSync(dir);
        }
        res.status(200).send(keyObject);
    });
}