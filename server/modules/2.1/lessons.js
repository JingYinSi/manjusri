const lessonModel = require('../../wechat/models/lesson'),
    practiceModel = require('../../wechat/models/practice'),
    ObjectID = require('mongodb').ObjectID,
    Promise = require('bluebird');

module.exports = {
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
    }
}