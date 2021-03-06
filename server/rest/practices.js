/**
 * Created by clx on 2017/4/8.
 */
const lessons = require('../modules/lessons'),
    Practics = require('../modules/2.1/Practics'),
    logger = require('@finelets/hyper-rest/app/Logger'),
    linkage = require('../rests');

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

    getLessonPractices: function (req, res) {
        var lordid = req.params.lordid;
        var lessonid = req.params.lessonid;
        return lessons.getLessonPractices(lessonid, lordid)
            .then(function (data) {
                var links = {
                    self: linkage.getLink('lessonPractices', {lessonid: lessonid, lordid: lordid}),
                }
                return res.status(200).json({data: data, links: links});
            })
            .catch(function (err) {
                return res.status(500).json(err);
            })
    },

    announcePractice: function (req, res) {
        var lordid = req.params.lordid;
        var lessonid = req.params.lessonid;
        var times = Math.round(req.body.times * 1);
        var num = Math.round(req.body.num * 1);
        var give = req.body.give;
        logger.debug('~~~~~~~~announcePractics data:' + JSON.stringify({
            lord: lordid,
            lesson: lessonid,
            times: times,
            num: num,
            give: give
        }));
        return Practics.announcePractics(lordid, lessonid, {times: times, num: num, give: give})
            .then(function () {
                return res.status(200).end();
            })
            .catch(function (reason) {
                if (!reason.sendStatusTo) {
                    logger.error('we catch a error which type is expected to Reason, but actually not: '
                        + JSON.stringify(reason, null, 4));
                    return res.status(500).end();
                } else
                    return reason.sendStatusTo(res);
            })
    }
}