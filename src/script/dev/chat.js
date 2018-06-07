var ObjectID = require("mongodb").ObjectID;

module.exports = function (app, passport, db) {

    app.get('/chatdb', passport.isLoggedIn, (req, res) => {
        res.render('chatDB');
    });

    app.get('/chatDetail', passport.isLoggedIn, (req, res) => {
        db.collection('chat').aggregate([{
            $match: {
                studentID: parseInt(req.query.id)
            }
        },{
            $sort: {
                timestamp: 1
            }
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
            res.render('chatDetail',{
                chats: chats
            });
        });
    });
}