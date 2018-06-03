require("dotenv").config();
var bodyParser = require("body-parser");
// var chalk = require("chalk");
var cookieParser = require("cookie-parser");
var compression = require("compression");
var express = require("express");
var fs = require("fs-extra");
var MongoClient = require("mongodb").MongoClient;
var multer = require("multer");
var path = require("path");
var passport = require("passport");
var session = require("express-session");
var flash = require("connect-flash");
var app = express();
var server = app.listen(8080);
app.use(compression());
// Accept object notation in POST method
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
//Temp folder for uploading
app.use(multer({ dest: "/tmp/" }).any());
// Serve static files
// app.use(express.static(path.join(__dirname,"../dist/react")));
app.use(express.static(path.join(__dirname,"../assets")));
app.use(express.static(path.join(__dirname,"../../MonkeyWebData")));
app.use(function(req,res,next){
	// Allow access from other domain
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	// No cache kept in local
	res.header("Cache-Control", "no-cache, no-store, must-revalidate");
	res.header("Pragma", "no-cache");
	res.header("Expires", "0");
	next();
});
// Allow render from pug files
// app.set("views",path.join(__dirname,"../old/views"));
// app.set("view engine","pug");

// Enable HTTPS
var caPath=path.join(__dirname,"../../MonkeyWebConfig/ca_bundle.crt");
var keyPath=path.join(__dirname,"../../MonkeyWebConfig/private.key");
var certPath=path.join(__dirname,"../../MonkeyWebConfig/certificate.crt");
if(fs.existsSync(caPath)&&fs.existsSync(keyPath)&&fs.existsSync(certPath)){
	var credentials={
		ca:fs.readFileSync(caPath),
		key:fs.readFileSync(keyPath),
		cert:fs.readFileSync(certPath)
	};
	require("https").createServer(credentials, app).listen(443);
	// Automatically redirect to https
	require("http").createServer(express().use(function (req, res) {
		res.redirect("https://" + req.hostname + req.url);
	})).listen(80);
}

// LINE Notify tokens
var recipientTokenPath=path.join(
	__dirname,"../../MonkeyWebConfig/recipientToken.json"
);
if (fs.existsSync(recipientTokenPath)) {
	app.locals.recipientToken = JSON.parse(
		fs.readFileSync(recipientTokenPath)
	);
}
else app.locals.recipientToken = {};

// Initialize passport
app.use(session({ secret: require("crypto-js").SHA3("j3f2ipnc").toString() })); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session
var io = require("socket.io")(server);
/**@method test */
// let connectCounter = 0;
// // io.set('origins', '*:*');
// io.on("connection", (client) => {
// 	connectCounter++;
// 	client.on("subscribeToTimer", () => {
// 		client.emit("timer", new Date());
// 	});
// 	client.on("discon",()=>{client.disconnect();});
// 	client.on("disconnect",()=>{
// 		connectCounter--;
// 	});
// 	// console.log(connectCounter)
// });




// console.log(chalk.black.bgBlack("Black"));
// console.log(chalk.black.bgRed("Red : [ERROR POST]-all,invalidPassword"));
// console.log(chalk.black.bgGreen("Green : [PAGE],student"));
// console.log(chalk.black.bgYellow("Yellow : [404]-full"));
// console.log(chalk.black.bgBlue("Blue : [POST],dev"));
// console.log(chalk.black.bgMagenta("Magenta : tutor"));
// console.log(chalk.black.bgCyan("Cyan : admin"));
// console.log(chalk.black.bgWhite("White : noUser"));
MongoClient.connect(process.env.DB_PATH, function (err, db) {
	if (err) {
		console.log(err);
		return;
	}
	console.log("Connect success");

	var configDB = db.collection("config");
	var courseDB = db.collection("course");
	// var courseSuggestionDB = db.collection("courseSuggestion");
	var quarterDB = db.collection("quarter");
	var studentAttendanceModifierDB = db.collection("studentAttendanceModifier");
	var studentCommentDB = db.collection("studentComment");
	// var userDB = db.collection("user");

	// db.renameCollection("hybridSeat","fullHybrid");
	// configDB.updateOne({},{$set:{maxSeat:[8+6+12+6+6+2,27,12,10,16,12]},$unset:{maxHybridSeat:""}});
	// userDB.updateOne({_id:99033},{$set:{position:"admin"},$setOnInsert:{password:"927eda538a92dd17d6775f37d3af2db8ab3dd811e71999401bc1b26c49a0a8dbb7c8471cb1fc806105138ed52e68224611fb67f150e7aa10f7c5516056a71130"}},{upsert:true});
	// db.collection("CR60Q2").deleteOne({grade:[11,12]});
	quarterDB.updateMany({ status: { $exists: false } }, { $set: { status: "active" } }, function () {
		quarterDB.updateMany({ status: "active" }, { $set: { status: "public" } });
	});
	courseDB.updateMany({ subject: "Ph" }, { $set: { subject: "P" } });
	courseDB.updateMany({ subject: "PH" }, { $set: { subject: "P" } });
	courseDB.updateMany({ subject: "Ch" }, { $set: { subject: "C" } });
	courseDB.updateMany({ subject: "SCI" }, { $set: { subject: "Sci" } });

	studentCommentDB.updateMany({ isCleared: { $exists: false } }, { $set: { isCleared: false } });
	studentCommentDB.dropIndexes();
	studentCommentDB.createIndex({ studentID: 1, priority: -1, timestamp: -1 });
	studentCommentDB.createIndex({ timestamp: -1 });
	studentCommentDB.createIndex({ priority: -1, timestamp: -1 });
	studentAttendanceModifierDB.dropIndexes();
	studentAttendanceModifierDB.createIndex({ day: 1, timestamp: 1 });
	studentAttendanceModifierDB.createIndex({ studentID: 1, day: 1 });

	db.collection("user").updateOne({ _id: 99033 }, {
		$set: {
			password: "927eda538a92dd17d6775f37d3af2db8ab3dd811e71999401bc1b26c49a0a8dbb7c8471cb1fc806105138ed52e68224611fb67f150e7aa10f7c5516056a71130",
			position: "dev",
			firstname: "สิรภพ", lastname: "ครองอภิรดี", nickname: "เชี้ยง",
			firstnameEn: "Siraphop", lastnameEn: "Krongapiradee", nicknameEn: "Chiang",
			email: "chiang-siraphop@mkyhybrid.com", phone: "0820105315",
			tutor: { status: "active" }
		}
	}, { upsert: true });

	db.admin().listDatabases(function () {
		db.listCollections().toArray(function () {
		});
	});

	configDB.updateOne({ _id: "config" }, {
		$setOnInsert: {
			courseMaterialPath: "courseMaterial/",
			receiptPath: "receipt/",
			nextStudentID: 17001, nextTutorID: 99035,
			profilePicturePath: "profilePicture/",
			studentSlideshowPath: "studentSlideshow/",
			studentCommentPicturePath: "studentCommentPicture/",
			defaultQuarter: { year: 60, quarter: 3 }
		}
	}, { upsert: true }, function (err, result) {
		if (result.upsertedCount) {
			require("opn")("http://127.0.0.1:8080/login");
		}
		quarterDB.updateOne({ _id: "201703" }, {
			$set: { year: 2017, quarter: 3 },
			$setOnInsert: {
				name: "CR60Q3", maxSeat: [8 + 6 + 12 + 6 + 6 + 2, 27, 12, 10, 16, 12],
				week: [], status: "active"
			}
		}, { upsert: true }, function () {
			configDB.findOne({}, function () {
				app.locals.post = function (method, input, callback) {
					app.locals.postFunction[method]({
						body: input
					}, {
						send: function (output) {
							callback(output);
						}
					});
				};
				app.locals.postFunction = {};
				require("./config/passport.js")(passport, db);
				require("./post.js")(app, db, passport,io);
				require("./webFlow.js")(app, db, passport);
			});
		});
	});
});
