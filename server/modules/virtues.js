/**
 * Created by clx on 2016/11/20.
 */
const VirtueSchema = require('../wechat/models/virtue'),
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

Virtues.prototype.listLordVirtues = function (lordId) {
    var list = [];
    return VirtueSchema
        //.find({lord: mongoose.Types.ObjectId(lordId), state: 'payed'})
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