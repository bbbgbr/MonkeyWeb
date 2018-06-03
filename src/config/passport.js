var LocalStategy = require("passport-local").Strategy;
// var CryptoJS = require("crypto-js");

module.exports = function (passport, db) {

	var User = db.collection("user");

	passport.serializeUser(function (user, done) {
		done(null, user._id);
	});

	passport.deserializeUser(function (id, done) {
		//do something
		User.findOne({
			_id: parseInt(id)
		}, function (err, user) {
			done(err, user);
		});
	});

	passport.use("local", new LocalStategy({
		usernameField: "id",
		passwordField: "password",
		passReqToCallback: true
	}, function (req, id, password, done) {
		process.nextTick(function () {
			User.findOne({
				"_id": parseInt(id),
				password: password
			}, function (err, user) {
				if (err) return done(err);
				if (!user) return done(null, false);
				done(null, user);
			});
		});
	}));
};