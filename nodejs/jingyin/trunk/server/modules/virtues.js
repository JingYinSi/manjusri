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

Virtues.prototype.findLordVirtues = function (lordId, day) {
    var theday = day ? day : new Date();
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

    logger.debug("begin find daily part");
    return PartSchema.findOne({type: 'daily'}).exec()
        .then(function (daily) {
            dailyId = daily._id;
            logger.debug("begin find daily part -- " + dailyId + " virtues ..........");
            var sql = [
                {
                    $match: {
                        lord: lordId, state: 'payed', subject: dailyId,
                        timestamp: {$gte: dateUtils.minToday(theday), $lte: dateUtils.maxToday(theday)}
                    }
                },
                {
                    $group: {
                        _id: null,
                        count: {$sum: 1},
                        sum: {$sum: "$amount"}
                    }
                }
            ];
            return VirtueSchema.aggregate(sql).exec();
        })
        .then(function (data) {
            if(data.length > 0){
                data = data[0];
                delete data._id;
                logger.debug("aggregate today daily virtues success:" + JSON.stringify(data));
                result.daily.thisday = data;
            }
            return VirtueSchema.aggregate([
                {
                    $match: {
                        lord: lordId, state: 'payed', subject: dailyId,
                        timestamp: {$gte: dateUtils.minThisMonth(theday), $lte: dateUtils.maxThisMonth(theday)}
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
            if(data.length > 0){
                data = data[0];
                delete data._id;
                logger.debug("aggregate this month daily virtues success:" + JSON.stringify(data));
                result.daily.thisMonth = data;
            }
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
            if(data.length > 0){
                data = data[0];
                delete data._id;
                logger.debug("aggregate this total daily virtues success:" + JSON.stringify(data));
                result.daily.total = data;
            }
            return VirtueSchema
                .find({lord: lordId, state: 'payed', subject: {$ne: dailyId}})
                .sort({timestamp: -1})
                .populate('subject')
                .exec()
                .then(function (virtues) {
                    virtues.forEach(function (v) {
                        var d = {
                            date: v.timestamp,
                            subject: v.subject.name,
                            img:v.subject.img,
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