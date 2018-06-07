var ObjectID = require("mongodb").ObjectID;

module.exports = function (app, db, post) {
    var chatDB = db.collection('chat');

    post('/post/v1/addChat', function (req, res) {
        if (!(req.body.msg && req.body.studentID)) {
            return res.status(400).send({
                err: 0,
                msg: 'Bad Request'
            });
        }
        if (!req.user) {
            return res.status(400).send({
                err: 2,
                msg: 'Unauthorize'
            });
        }
        chatDB.insertOne({
            timestamp: new Date(),
            msg: req.body.msg,
            studentID: parseInt(req.body.studentID),
            sender: parseInt(req.user._id)
        }).then((result) => {
            res.status(200).send({
                msg: 'OK'
            });
        });
    });

    post('/post/v1/listChat', function (req, res) {
        if (!(req.body.studentID)) {
            return res.status(400).send({
                err: 0,
                msg: 'Bad Request'
            });
        }
        var limit = 10;
        if (req.body.limit) {
            limit = parseInt(req.body.limit);
        }
        chatDB.aggregate([{
            $match: {
                studentID: parseInt(req.body.studentID)
            }
        }, {
            $sort: {
                timestamp: -1
            }
        },{
            $limit: limit
        }, {
            $lookup: {
                from: 'user',
                localField: 'sender',
                foreignField: '_id',
                as: 'sender'
            }
        }]).toArray().then(chats => {
            chats.map(chat => {
                chat.sender = chat.sender[0];
                chat.chatID = chat._id;
                delete chat._id;
                delete chat.sender.password;
                delete chat.sender.position;
                delete chat.sender.email;
                delete chat.sender.phone;
                delete chat.sender.tutor;
                delete chat.sender.subPosition;
            });
            res.status(200).send({
                chats: chats
            });
        });
    });

    post('/post/v1/deleteChat', function (req, res) {
        if(!req.body.chatID){
            return res.status(400).send({
                err: 1,
                msg: 'Bad Request'
            });
        }
        chatDB.deleteOne({
            _id: ObjectID(req.body.chatID)
        }).then(_ => {
            res.status(200).send({
                msg: 'OK'
            });
        });
    });
}