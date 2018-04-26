const ObjectID = require('mongodb').ObjectID,
    Promise = require('bluebird'),
    createErrorReason = require('@finelets/hyper-rest/app').createErrorReason,
    logger = require('@finelets/hyper-rest/app/Logger'),
    _ = require('underscore'),
    dateUtils = require('../../../modules/utils').dateUtils,
    moment = require('moment'),
    dbModel = require('../../wechat/models'),
    createObjectId = require('@finelets/hyper-rest/db/mongoDb/CreateObjectId'),
    dbSave = require('@finelets/hyper-rest/db/mongoDb/SaveObjectToDb'),
    Lessons = require('./Lessons');

const fields_lesson = ['type', 'name', 'banner', 'img', 'unit'];

module.exports = {
    listDetails: function (lordid) {
        var lessons = [];
        var lines;
        return createObjectId(lordid)
            .then(function (id) {
                lines = [
                    {"$match": {"num": {$gt: 0}}},
                    {
                        $facet: {
                            total: [
                                {
                                    $group: {
                                        _id: "$lesson",
                                        count: {$sum: 1}, sum: {$sum: "$num"}
                                    }
                                }
                            ],
                            me: [
                                {"$match": {"lord": id}},
                                {
                                    $group: {
                                        _id: {lesson: "$lesson", begDate: "$begDate"},
                                        sum: {$sum: "$num"}
                                    }
                                }
                            ]
                        }
                    }
                ];
                return Lessons.listOpeningLessons(fields_lesson);
            })
            .then(function (list) {
                if (list.length < 1) return [];
                list.forEach(function (item) {
                    var data = {
                        lesson: item,
                        join: 0,
                        practice: 0,
                        me: {
                            practice: 0
                        }
                    };
                    lessons.push(data);
                });
                return dbModel.Practices.aggregate(lines)
                    .then(function (data) {
                        data = data[0];
                        data.total.forEach(function (item) {
                            lessons.forEach(function (les) {
                                if (item._id.toString() === les.lesson.id) {
                                    les.join = item.count;
                                    les.practice = item.sum;
                                }
                            });
                        });
                        data.me.forEach(function (item) {
                            lessons.forEach(function (les) {
                                if (item._id.lesson.toString() === les.lesson.id) {
                                    les.me.practice = item.sum;
                                    if (item._id.begDate) les.me.begDate = item._id.begDate;
                                }
                            });
                        });
                        return lessons;
                    })
            })
    },
    lessonDetails: function (lordId, lessonId) {
        var result = {
            lesson: null,
            join: 0,
            practice: 0,
            me: {
                practice: 0
            }
        };
        return createObjectId(lordId)
            .then(function (myId) {
                return Lessons.findById(lessonId, fields_lesson)
                    .then(function (lesson) {
                        if (!lesson) {
                            var msg = 'the lesson with id ' + lessonId + ' not found!';
                            logger.error(msg);
                            return Promise.reject(createErrorReason(404, msg));
                        }
                        result.lesson = lesson;
                        var lines = [
                            {"$match": {"lesson": ObjectID(lesson.id), "num": {$gt: 0}}},
                            {
                                $facet: {
                                    total: [
                                        {
                                            $group: {
                                                _id: "$lesson",
                                                count: {$sum: 1}, sum: {$sum: "$num"}
                                            }
                                        }
                                    ],
                                    me: [
                                        {"$match": {"lord": myId}},
                                        {
                                            $group: {
                                                _id: {lesson: "$lesson", give: "$give"},
                                                sum: {$sum: "$num"}
                                            }
                                        }
                                    ]
                                }
                            }
                        ];
                        return dbModel.Practices.aggregate(lines)
                            .then(function (data) {
                                data = data[0];
                                var total = data.total;
                                if (total.length > 0) {
                                    result.join = data.total[0].count;
                                    result.practice = data.total[0].sum;
                                }
                                if (data.me.length > 0) {
                                    result.me.give = data.me[0]._id.give;
                                    result.me.practice = data.me[0].sum;
                                }
                                return result;
                            });
                    });
            })
    },
    announcePractics: function (lordId, lessonId, data) {
        var lord, lesson;
        return createObjectId(lordId)
            .then(function (id) {
                lord = id;
                return createObjectId(lessonId);
            })
            .then(function (id) {
                lesson = id;
                var num = data.times * data.num;
                if (num < 0) return Promise.reject(createErrorReason(400, '修量申报数据有误!'));
                return dbModel.Users.count({_id: lord});
            })
            .then(function (count) {
                if (count !== 1) {
                    return Promise.reject(createErrorReason(404, "The user does't exist!"));
                }
                return dbModel.Lessons.count({_id: lesson});
            })
            .then(function (count) {
                if (count !== 1) return Promise.reject(createErrorReason(404, "The lesson does't exist!"));
                return dbModel.Practices.findOne({lord: lord, lesson: lesson})
            })
            .then(function (doc) {
                var model;
                if (doc) {
                    model = doc;
                    model.give = data.give;
                    if (model.num > 0) {
                        if (data.num < 0 || data.times < 0) { // 为扣减
                            __subsPractics(model, data);
                        } else { // 增加
                            __addPractics(model, data);
                        }
                    }
                    else {
                        // 过去曾经退出过，本次再次参加
                        if (data.num <= 0 || data.times <= 0) return null;
                        __setFirstPractics(model, lord, lesson, data);
                    }
                } else {
                    if (data.num <= 0 || data.times <= 0) return null;
                    model = new dbModel.Practices({});
                    __setFirstPractics(model, lord, lesson, data);
                }
                return model.save();
            })
            .then(function (doc) {
                return doc ? doc._doc : null;
            })
    },
    listPracticsForTheLessonOfToday: function (lessonId) {
        var lines = [
            {
                "$match": {
                    "lesson": ObjectID(lessonId),
                    "num": {$gt: 0},
                    "endDate": {
                        $gte: dateUtils.minToday(),
                        $lt: dateUtils.maxToday()
                    }
                }
            },
            {
                $facet: {
                    total: [
                        {
                            $group: {
                                _id: 1,
                                count: {$sum: 1}, times: {$sum: "$lastTimes"}, sum: {$sum: "$lastNum"}
                            }
                        }
                    ],
                    list: [
                        {
                            $group: {
                                _id: {
                                    lord: "$lord",
                                    times: "$times",
                                    num: "$num",
                                    lastTimes: "$lastTimes",
                                    lastNum: "$lastNum",
                                    give: "$give",
                                    time: "$endDate"
                                }
                            }
                        }
                    ]
                }
            }
        ];
        var result = {
            total: {count: 0, sum: 0},
            list: []
        };
        return dbModel.Practices.aggregate(lines)
            .then(function (data) {
                data = data[0];
                if (data.total[0]) {
                    delete data.total[0]._id;
                    result.total = data.total[0];
                    result.list = data.list;
                }
                return result;
            })
    }
}

const __setFirstPractics = function (model, lord, lesson, data) {
    var num = data.num;
    var times = data.times;
    var now = new Date();
    model.lord = lord;
    model.lesson = lesson;
    model.begDate = now;
    model.endDate = now;
    model.year = 0;
    model.month = 0;
    model.week = 0;
    model.times = times;
    model.num = num;
    model.lastTimes = times;
    model.lastNum = num;
    model.weekTimes = times;
    model.weekNum = num;
    model.monthTimes = times;
    model.monthNum = num;
    model.yearTimes = times;
    model.yearNum = num;
    model.give = data.give;
}

const __addPractics = function (model, data) {
    var num = data.num;
    var times = data.times;
    var now = new Date();
    var baseTime = model.begDate;
    model.times += times;
    model.num += num;
    var offsetYear = moment(now).diff(moment(baseTime), 'years');
    if (offsetYear === model.year) {
        model.yearTimes += times;
        model.yearNum += num;
    } else {
        model.yearTimes = times;
        model.yearNum = num;
        model.year = offsetYear;
    }
    var offsetMonth = moment(now).diff(moment(baseTime), 'months');
    if (offsetMonth === model.month) {
        model.monthTimes += times;
        model.monthNum += num;
    } else {
        model.monthTimes = times;
        model.monthNum = num;
        model.month = offsetMonth;
    }
    var offsetWeeks = moment(now).diff(moment(baseTime), 'weeks');
    if (offsetWeeks === model.week) {
        model.weekTimes += times;
        model.weekNum += num;
    } else {
        model.weekTimes = times;
        model.weekNum = num;
        model.week = offsetWeeks;
    }
    var offsetDays = dateUtils.offsetDays(new Date(model.endDate), new Date(now));
    if (offsetDays === 0) {
        model.lastTimes += times;
        model.lastNum += num;
    } else {
        model.lastTimes = times;
        model.lastNum = num;
    }
    model.endDate = now;
    model.give = data.give;
}

const __subsPractics = function (model, data) {
    var num = data.num;
    var times = data.times;
    model.times += times;
    if (model.times < 0) model.times = 0;
    model.num += num;
    if (model.num < 0) model.num = 0;
    model.give = data.give;
}