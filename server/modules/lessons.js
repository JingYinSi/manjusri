/**
 * Created by clx on 2017/4/23.
 */
const lessonModel = require('../wechat/models/lesson'),
    practiceModel = require('../wechat/models/practice'),
    userModel = require('../wechat/models/user'),
    utils = require('../../modules/utils'),
    ObjectID = require('mongodb').ObjectID,
    Promise = require('bluebird'),
    logger = require('@finelets/hyper-rest/app/Logger');

module.exports = {
    add: function (data) {
        var model = new lessonModel(data);
        return model.save()
            .then(function (doc) {
                return doc._doc;
            });
    },

    getLessonPractices: function (lessonid, lordid) {
        var lesson, lord;
        try {
            lesson = ObjectID(lessonid);
            lord = ObjectID(lordid);
        }
        catch (err) {
            return Promise.reject(err);
        }
        var lines = [
            {"$match": {"lesson": lesson, "state": 'on'}},
            {
                $facet: {
                    total: [
                        {
                            $group: {
                                _id: null,
                                count: {$sum: 1}, sum: {$sum: "$num"}
                            }
                        }
                    ],
                    me: [
                        {"$match": {"lord": lord}},
                    ],
                }
            }
        ];
        return practiceModel.aggregate(lines)
            .then(function (data) {
                data = data[0];
                var result = {
                    join: data.total[0].count,
                    practice: data.total[0].sum,
                };
                if (data.me.length > 0)
                    result.me = {
                        practice: data.me[0].num,
                        begDate: data.me[0].begDate
                    };
                return result;
            })
    },

    listLessons: function (lordid) {
        var lord;
        try {
            lord = ObjectID(lordid);
        }
        catch (err) {
            return Promise.reject(err);
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
        return lessonModel.find()
            .select('name img unit')
            .exec()
            .then(function (list) {
                list.forEach(function (item) {
                    var data = {
                        lesson: item._doc,
                        join: 0,
                        practice: 0,
                        me: {
                            practice: 0,
                        },
                    };
                    lessons.push(data);
                });
                return practiceModel.aggregate(lines);
            })
            .then(function (data) {
                data = data[0];
                data.total.forEach(function (item) {
                    lessons.forEach(function (les) {
                        if (item._id.equals(les.lesson._id)) {
                            les.join = item.count;
                            les.practice = item.sum;
                        }
                    });
                });
                data.me.forEach(function (item) {
                    lessons.forEach(function (les) {
                        if (item._id.lesson.equals(les.lesson._id)) {
                            les.me.practice = item.sum;
                            if (item._id.begDate) les.me.begDate = item._id.begDate;
                        }
                    });
                });
                return lessons;
            })
    },

    listMyLessons: function (lordid) {
        var result = [];
        return this.listLessons(lordid)
            .then(function (list) {
                list.forEach(function (item) {
                    if (item.me.practice > 0) result.push(item);
                });
                return result;
            })
    },

    announce: function (lordid, lessonid, num) {
        var lord, lesson;
        try {
            lord = ObjectID(lordid);
            lesson = ObjectID(lessonid);
        }
        catch (err) {
            return Promise.reject(err);
        }

        return userModel.count({_id: lord})
            .then(function (count) {
                if (count !== 1) return Promise.reject(new Error("The user does't exist!"));
                return lessonModel.count({_id: lesson});
            })
            .then(function (count) {
                if (count !== 1) return Promise.reject(new Error("The lesson does't exist!"));
                return practiceModel.findOne({lord: lord, lesson: lesson})
            })
            .then(function (doc) {
                var model;
                if (doc) {
                    model = doc;
                    if (model.state === 'on') {
                        // 再次报数
                        var updatedNum = utils.round(model.num + num, 1);
                        if (updatedNum <= 0) {
                            model.state = 'deleted';
                            return model.save()
                                .then(function () {
                                    return null;
                                });
                        } else {
                            model.num = updatedNum;
                        }
                    }
                    else {
                        // 过去曾经退出过，本次再次参加， state==='deleted'
                        if (num > 0) {
                            model.num = utils.round(num, 1);
                            model.begDate = new Date();
                            model.state = 'on';
                        } else {
                            // 再次参加无效
                            return null;
                        }
                    }

                } else {
                    if (num <= 0) return null;
                    model = new practiceModel({
                        lord: lord,
                        lesson: lesson,
                        num: num,
                    });
                }
                return model.save();
            })
            .then(function (doc) {
                return doc ? doc._doc : null;
            })
    }
};