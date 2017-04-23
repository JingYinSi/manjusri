/**
 * Created by clx on 2017/4/8.
 */
const lessons = require('../modules/lessons'),
    linkage = require('../rests');

var log4js = require('log4js');
log4js.configure("log4js.conf", {reloadSecs: 300});
var logger = log4js.getLogger();

module.exports = {
    addLesson: function (req, res) {
        var data = req.body;
        return lessons.add(data)
            .then(function (doc) {
                var result = {
                    data: doc,
                    links: {
                        self: linkage.getLink('lessonResource', {id: doc._id}),
                    }
                }
                return res.status(201).json(result);
            })
            .catch(function (err) {
                return res.status(500).json(err);
            })
    },

    announcePractice: function (req, res) {
        var lordid = req.params.lordid;
        var lessonid = req.params.lessonid;
        return lessons.announce(lordid, lessonid, req.body.num)
            .then(function (doc) {
                return res.status(200).json({
                    data: doc,
                })
            })
            .catch(function (err) {
                return res.json(500, err);
            })
    },
}