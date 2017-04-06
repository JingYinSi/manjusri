/**
 * Created by clx on 2016/11/20.
 */
const VirtueSchema = require('../wechat/models/virtue'),
    PartSchema = require('../wechat/models/part'),
    dateUtils = require('../../modules/utils').dateUtils,
    mongoose = require('mongoose'),
    Promise = require('bluebird');

var log4js = require('log4js');
log4js.configure("log4js.conf", {reloadSecs: 300});
var logger = log4js.getLogger();

//TODO:隐藏getTimestamp
function Virtues() {
    this.getTimestamp = function () {
        return Date.now();
    }
}

Virtues.prototype.findNewVirtueById = function (virtueId) {
    return VirtueSchema.findById(virtueId)
        .populate('subject')
        .exec()
        .then(function (doc) {
            if (!doc) return null;
            if (doc.state !== 'new') {
                logger.error('we are finding a new virtue, but what we are found is ' + doc.state + ' ???');
                return null;
            }
            return doc;
        });
}

Virtues.prototype.listLordVirtues = function (lordId, day) {
    var theday = day ? day : new Date();
    var result = {
        daily: {
            thisday: {count: 0, sum: 0},
            thisMonth: {count: 0, sum: 0},
            total: {count: 0, sum: 0}
        },
        virtues: {count: 0, sum: 0, details: []}
    };


    function doListLordVirtues(dailyId) {
        var group = {
            $group: {
                _id: null,
                count: {$sum: 1},
                sum: {$sum: "$amount"}
            }
        };

        var todayMatch = {
            $match: {
                lord: lordId, state: 'payed', subject: dailyId,
                timestamp: {$gte: dateUtils.minToday(theday), $lte: dateUtils.maxToday(theday)}
            }
        }
        var monthMatch = {
            $match: {
                lord: lordId, state: 'payed', subject: dailyId,
                timestamp: {$gte: dateUtils.minThisMonth(theday), $lte: dateUtils.maxThisMonth(theday)}
            }
        }
        var totalMatch = {
            $match: {
                lord: lordId, state: 'payed', subject: dailyId
            }
        }

        var tasks = [
            VirtueSchema.aggregate([todayMatch, group]).exec(),
            VirtueSchema.aggregate([monthMatch, group]).exec(),
            VirtueSchema.aggregate([totalMatch, group]).exec(),
            VirtueSchema
                .find({lord: lordId, state: 'payed', subject: {$ne: dailyId}})
                .sort({timestamp: -1})
                .populate('subject')
                .exec()
                .then(function (virtues) {
                    virtues.forEach(function (v) {
                        var d = {
                            date: v.timestamp,
                            subject: v.subject.name,
                            img: v.subject.img,
                            num: v.num,
                            amount: v.amount
                        };
                        result.virtues.count++;
                        result.virtues.sum += v.amount;
                        result.virtues.details.push(d);
                    });
                    return result;
                })
        ];
        return Promise.all(tasks)
            .then(function (data) {
                if (data[0].length > 0) {
                    delete data[0][0]._id;
                    result.daily.thisday = data[0][0];
                }
                if (data[1].length > 0) {
                    delete data[1][0]._id;
                    result.daily.thisMonth = data[1][0];
                }
                if (data[2].length > 0) {
                    delete data[2][0]._id;
                    result.daily.total = data[2][0];
                }
                result.virtues = data[3].virtues;
                return result;
            });
    }

    return PartSchema.findOne({type: 'daily'}).exec()
        .then(function (daily) {
            return doListLordVirtues(daily._id);
        });
}

var virtueListQuery = VirtueSchema
    .find({state: 'payed'})
    .sort({timestamp: -1})
    .populate('lord', 'name')
    .populate('subject', 'name');

Virtues.prototype.listLastVirtues = function (count) {
    return new Promise(function (resolve, reject) {
        var list = [];
        virtueListQuery.limit(count).exec()
            .then(function (virtues) {
                    virtues.forEach(function (v) {
                        var d = {
                            date: v.timestamp,
                            lord: v.lord ? v.lord.name : '未知',
                            subject: v.subject.name,
                            num: v.num,
                            amount: v.amount
                        };
                        list.push(d);
                    });
                    return resolve(list);
                },
                function (err) {
                    logger.error('Virtues list error:' + err.message);
                    return reject(err);
                });
    });
}

Virtues.prototype.lastVirtuesAndTotalCount = function (type, count) {
    var lines = [
        {$lookup: {from: "parts", localField: "subject", foreignField: "_id", as: "partdoc"}},
        {$lookup: {from: "users", localField: "lord", foreignField: "_id", as: "userdoc"}},
        {"$match": {"state": "payed", "partdoc.type": type}},
        {"$sort": {"timestamp": -1}},
        {
            "$facet": {
                "byDaily": [
                    {
                        $project: {
                            "_id": 0,
                            "name": "$userdoc.name",
                            "date": "$timestamp",
                            /*"year": {"$year": "$timestamp"},
                            "month": {"$month": "$timestamp"},
                            "day": {"$dayOfMonth": "$timestamp"},*/
                            "city": "$userdoc.city",
                            "amount": 1
                        }
                    },
                    {"$limit": count},
                ],
                "total": [{
                    "$group": {"_id": "$subject", "count": {"$sum": 1}}
                }]
            }
        }];

    var result = {
        count: 0,
        virtues: []
    }

    return VirtueSchema.aggregate(lines)
        .then(function (data) {
            if(data.length < 1 || !data[0].total || !data[0].byDaily)
                return result;
            data = data[0];
            result.id = data.total[0]._id;
            result.count = data.total[0].count;
            data.byDaily.forEach(function (item) {
                result.virtues.push({
                    "amount": item.amount,
                    "city": item.city.length > 0 ? item.city[0] : '未知',
                    "day": item.date.getDate(),
                    "month": item.date.getMonth() + 1,
                    "name": item.name.length > 0 ? item.name[0] : '未知',
                    "year": item.date.getFullYear()
                })
            });
            return result;
        });
}

Virtues.prototype.place = function (subject, amount, detail, giving) {
    var self = this;
    var data = {
        timestamp: self.getTimestamp()
    };
    if (subject) data.subject = subject;
    if (amount) data.amount = amount;
    if (detail) {
        if (detail.price) data.price = detail.price;
        if (detail.num) data.num = detail.num;
    }
    if (giving) data.giving = giving;

    return new VirtueSchema(data).save();
}

module.exports = new Virtues();