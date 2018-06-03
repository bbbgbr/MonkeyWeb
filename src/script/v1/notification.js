// var ObjectID = require("mongodb").ObjectID;
// var apn = require("apn");

module.exports = function (app, db, post) {

	var deviceTokenDB = db.collection("deviceToken");

	post("/post/v1/registeriOSDeviceToken", function (req, res) {
		if (!(req.body.id && req.body.token)) {
			res.status(400).send({
				err: 0,
				msg: "Bad Request"
			});
		}
		deviceTokenDB.update({
			_id: req.body.token
		}, {
			$set: {
				device: "iOS",
				userID: parseInt(req.body.id)
			}
		}, {
			upsert: true
		}).then(() => {
			res.status(200).send({
				msg: "OK"
			});
		});
	});

};