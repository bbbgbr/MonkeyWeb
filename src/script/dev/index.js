module.exports = function (passport, db) {
    var bodyParser = require('body-parser');
    var cookieParser = require('cookie-parser');
    var express = require('express');
    var morgan = require('morgan');
    var app = express();

    app.use(express.static('assets'));
    app.use(morgan('tiny'));

    app.get('*', passport.isLoggedIn, (req,res,next) => {
        if(req.user.position !== 'dev') return res.render('404');
        next();
    });

    app.get('/', passport.isLoggedIn, (req, res) => {
        res.render('devHome');
    });

    require('./task.js')(app, passport, db);
    require('./chat.js')(app, passport, db);
    require('./quota.js')(app, passport, db);

    app.all('/*',(req,res) => {
        res.render('404');
    });

    return app;
}