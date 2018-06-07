var ObjectID = require("mongodb").ObjectID;

module.exports = function (app, passport, db) {
    app.get('/quota', passport.isLoggedIn, (req, res) => {
        res.render('quota');
    });
}