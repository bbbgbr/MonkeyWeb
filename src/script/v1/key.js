var ObjectID = require('mongodb').ObjectID;
var CryptoJS = require('crypto-js');
const AES_PASSWORD = 'monkey';

/**
 * Edit system path here
 */
const destinationConst = '/Volumes/';
const isMacDebugging = !/^win/.test(process.platform);
/**
 * End editing path
 */

 /**
 * Method for checking request ip address if the request send from local network
 * @param {request} req request information containing ip address
 */
function isLocal(req) {
    var index = req.ip.match(/\d/);
    var ipAddress = req.ip.substring(index.index, req.ip.length);
    if (ipAddress.substring(0, 7) === '192.168' || ipAddress === '125.25.54.23') {
        return false;
    }
    return true;
}


module.exports = function (app, db, post, fs) {
    post('/post/v1/getKeyStudentPath', function (req, res) {
        if (!req.body.path) {
            return res.status(400).send({
                err: 0,
                msg: 'Bad Reqeust'
            });
        }
        var requestObject = {
            path: req.body.path
        }
        var string = JSON.stringify(requestObject)
        var encrypted = CryptoJS.AES.encrypt(string, AES_PASSWORD);
        return res.status(200).send({
            path: encodeURIComponent(encrypted.toString())
        });
    });

    app.get('/get/v1/keyStudent', function (req, res) {
        if (!req.query.k) {
            return res.status(400).send({
                err: 0,
                msg: 'Bad Reqeust'
            });
        }
        if (isLocal(req)) {
            return res.status(401).send({
                err: 0,
                msg: 'Unauthorize network'
            });
        }
        var query = decodeURIComponent(req.query.k);
        var decrypted = CryptoJS.AES.decrypt(query, AES_PASSWORD);
        var decode = decrypted.toString(CryptoJS.enc.Utf8);
        var requestObject = JSON.parse(decode);
        if (!requestObject.path) {
            return res.status(400).send({
                err: 0,
                msg: 'Bad Reqeust'
            });
        }
        if (requestObject.path.search('key-student') === -1) {
            return res.status(400).send({
                err: 0,
                msg: 'Bad Reqeust'
            });
        }

        if (isMacDebugging) {
            var string = requestObject.path;
            var result = string.replace('file://monkeycloud/', destinationConst);
            requestObject.path = result;
        }
        var path = requestObject.path
        var file = fs.createReadStream(path);
        var stat = fs.statSync(path);
        res.setHeader('Content-Length', stat.size);
        res.setHeader('Content-Type', 'application/pdf');
        file.pipe(res);
    });
}