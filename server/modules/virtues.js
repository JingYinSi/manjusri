/**
 * Created by clx on 2016/11/20.
 */
const VirtueSchema = require('../wechat/models/virtue'),
    PartSchema = require('../wechat/models/part'),
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

Virtues.prototype.findLordVirtues = function (lordId) {
    logger.debug("begin find lord( " + lordId + " ) virtues");
    var result = {
        daily: {
            thisday: {count: 0, sum: 0},
            thisMonth: {count: 0, sum: 0},
            total: {count: 0, sum: 0}
        },
        virtues: {count: 0, sum: 0, details: []}
    };
    var dailyId;
    var todaystart = new Date();
    todaystart.setHours(0, 0, 0, 0);
    var todayend = new Date();
    todayend.setHours(23, 59, 59, 999);
    var thisyear, thismonth;
    thisyear = todaystart.getFullYear();
    thismonth = todaystart.getMonth();
    var firstDayOfThisMonth = new Date(thisyear, thismonth, 1);
    var lastDayOfThisMonth = new Date(new Date(thisyear, thismonth + 1, 1) - 1);

    logger.debug("begin find daily part");
    return PartSchema.findOne({type: 'daily'}).exec()
        .then(function (daily) {
            dailyId = daily.id;
            logger.debug("begin find daily part -- " + dailyId + " virtues ..........");
            return VirtueSchema.aggregate([
                /*{
                    $match: {
                        lord: lordId, state: 'payed', subject: dailyId,
                        timestamp: {$gte: todaystart, $lte: todayend}
                    }
                },*/
                {
                    $group: {
                        _id: null,
                        count: {$sum: 1},
                        sum: {$sum: "$amount"}
                    }
                }
            ]).exec();
        })
        .then(function (data) {
            logger.debug("begin aggregate today daily virtues:" + JSON.stringify(data[0]));
            result.daily.thisday = data[0];
            logger.debug("aggregate today daily virtues success");
            return VirtueSchema.aggregate([
                {
                    $match: {
                        lord: lordId, state: 'payed', subject: dailyId,
                        timestamp: {$gte: firstDayOfThisMonth, $lte: lastDayOfThisMonth}
                    }
                },
                {
                    $group: {
                        _id: null,
                        count: {$sum: 1},
                        sum: {$sum: "$amount"}
                    }
                }
            ]).exec();
        })
        .then(function (data) {
            result.daily.thisMonth = data;
            return VirtueSchema.aggregate([
                {
                    $match: {
                        lord: lordId, state: 'payed', subject: dailyId
                    }
                },
                {
                    $group: {
                        _id: null,
                        count: {$sum: 1},
                        sum: {$sum: "$amount"}
                    }
                }
            ]).exec();
        })
        .then(function (data) {
            result.daily.today = data;
            return VirtueSchema
                .find({lord: lordId, state: 'payed', subject: {$ne: dailyId}})
                .sort({timestamp: -1})
                .populate('subject', 'name')
                .exec()
                .then(function (virtues) {
                    virtues.forEach(function (v) {
                        var d = {
                            date: v.timestamp,
                            subject: v.subject.name,
                            num: v.num,
                            amount: v.amount
                        };
                        result.virtues.count++;
                        result.virtues.sum += v.amount;
                        result.virtues.details.push(d);
                    });
                    return result;
                });
        });
}


Virtues.prototype.listLordVirtues = function (lordId) {
    var list = [];
    return VirtueSchema
        .find({lord: lordId, state: 'payed'})
        .sort({timestamp: -1})
        .populate('subject', 'name')
        .exec()
        .then(function (virtues) {
            virtues.forEach(function (v) {
                var d = {
                    date: v.timestamp,
                    subject: v.subject.name,
                    num: v.num,
                    amount: v.amount
                };
                list.push(d);
            });
            return list;
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