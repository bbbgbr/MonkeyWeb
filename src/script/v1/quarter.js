module.exports = function (app, db, post) {

    var quarterDB = db.collection('quarter');

    /**
     * List all quarter available
     * req.body = {
     *      status: 'public' => Select from ['public','protected','private']
     * }
     * if not error
     * res.body = {
     *      quarterID: 201701,
     *      year: 2017,
     *      quarter: 1,
     *      ...
     * }
     */
    post('/post/v1/listQuarter', function (req, res) {
        var status;
        if (req.body.status === undefined) {
            status = 'public';
        } else {
            status = req.body.status;
        }
        var query = [];
        switch (status) {
            case 'private':
                query.push('private');
            case 'protected':
                query.push('protected');
            case 'public':
            default:
                query.push('public');
                break;
        }

        quarterDB.find({
            status: {
                $in: query
            }
        }).toArray().then(result => {
            for (var i = 0; i < result.length; i++) {
                result[i].quarterID = result[i]._id;
                delete result[i]._id;
            }
            return res.status(200).send(result);
        });
    });
}