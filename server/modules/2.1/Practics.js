const ObjectID = require('mongodb').ObjectID,
    Promise = require('bluebird'),
    createErrorReason = require('@finelets/hyper-rest/app').createErrorReason,
    logger = require('@finelets/hyper-rest/app/Logger'),
    _ = require('underscore'),
    dbModel = require('../../wechat/models'),
    createObjectId = require('@finelets/hyper-rest/db/mongoDb/CreateObjectId'),
    Lessons = require('./Lessons');

module.exports = {
    listDetails: function (lordid) {
        var lessons = [];
        var lines;
        return createObjectId(lordid)
            .then(function (id) {
                lines = [
                    {"$match": {"state": 'on'}},
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
                return Lessons.listOpeningLessons(['type', 'name', 'img', 'unit']);
            })
            .then(function (list) {
                if (list.length < 1) return [];
                list.forEach(function (item) {
                    var data = {
                        lesson: item,
                        join: 0,
                        practice: 0,
                        me: {
                            practice: 0,
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
                return Lessons.findById(lessonId, ["type", "name", "img", "unit"])
                    .then(function (lesson) {
                        if (!lesson) {
                            var msg = 'the lesson with id ' + lessonId + ' not found!';
                            logger.error(msg);
                            return Promise.reject(createErrorReason(404, msg));
                        }
                        result.lesson = lesson;
                        lines = [
                            {"$match": {"lesson": ObjectID(lesson.id), "state": 'on'}},
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
                                                _id: {lesson: "$lesson"},
                                                //_id: "$lesson",
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
                                if(total.length > 0){
                                    result.join = data.total[0].count;
                                    result.practice = data.total[0].sum;
                                }
                                if(data.me.length > 0) result.me.practice = data.me[0].sum;
                                return result;
                            });
                    });
            })
    }
}