const ObjectID = require('mongodb').ObjectID,
    Promise = require('bluebird'),
    createErrorReason = require('@finelets/hyper-rest/app/CreateErrorReason');
    logger = require('@finelets/hyper-rest/app/Logger');
    _ = require('underscore'),
    dbModel = require('../../wechat/models');

module.exports = {
    listDetails: function (lordid) {
        var lord;
        try {
            lord = ObjectID(lordid);
        }
        catch (err) {
            logger.error(err.stack);
            return Promise.reject(createErrorReason(500, err.stack));
        }

        var lessons = [];
        var lines = [
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
                        {"$match": {"lord": lord}},
                        {
                            $group: {
                                _id: {lesson: "$lesson", begDate: "$begDate"},
                                //_id: "$lesson",
                                sum: {$sum: "$num"}
                            }
                        }
                    ],
                }
            }
        ];
        return dbModel.Lessons.find({state: 'open'})
            .select('name img unit')
            .exec()
            .then(function (list) {
                if(list.length < 1) return [];
                list.forEach(function (item) {
                    var data = {
                        lesson: item.toJSON(),
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
    }
}