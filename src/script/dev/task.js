var ObjectID = require("mongodb").ObjectID;

module.exports = function (app, passport, db) {
    app.get('/taskDB', passport.isLoggedIn, (req, res) => {
        db.collection('task').find({
            parent: null
        }).sort({
            createOn: -1
        }).toArray().then(tasks => {
            res.render('taskDB', {
                tasks: tasks
            });
        });
    });

    app.get('/taskDetail', passport.isLoggedIn, (req, res) => {
        Promise.all([
            db.collection('task').findOne({
                _id: ObjectID(req.query.id)
            }),
            db.collection('task').find({
                ancestors: ObjectID(req.query.id)
            }).toArray()
        ]).then(values => {
            res.render('taskDetail', {
                head: values[0],
                tails: values[1]
            });
        });
    });
}