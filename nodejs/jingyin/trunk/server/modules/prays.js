/**
 * Created by clx on 2016/11/3.
 */
const userModel = require('../wechat/models/user'),
    prayModel = require('../wechat/models/pray'),
    ObjectID = require('mongodb').ObjectID,
    Promise = require('bluebird');

var log4js = require('log4js');
log4js.configure("log4js.conf", {reloadSecs: 300});
var logger = log4js.getLogger();

module.exports = {
    countTimesOfPrays: function (lordid) {
        var lines = [
            {
                $facet: {
                    totalTimes: [
                        {
                            $group: {
                                _id: null,
                                count: {$sum: 1}
                            }
                        }
                    ],
                    NOP: [
                        {
                            $group: {
                                _id: {lord: "$prayer"},
                                count: {$sum: 1}
                            }
                        }
                    ],
                    me: [
                        {"$match": {"prayer": lordid}},
                        {
                            $group: {
                                _id: null,
                                count: {$sum: 1}
                            }
                        }
                    ]
                }
            }
        ];
        return prayModel.aggregate(lines)
            .then(function (data) {
                var data = data[0];
                var mycount = data.me.length < 1 ? 0 : data.me[0].count;
                return {
                    me: mycount,
                    total: {
                        NOP: data.NOP.length,
                        times: data.totalTimes[0].count
                    }
                };
            });
    },

    findByLordAndId: function (prayid, lordid) {
        var lord, pray;
        try {
            lord = ObjectID(lordid);
            pray = ObjectID(prayid);
            return prayModel.findOne({_id: pray, prayer: lord})
                .then(function (data) {
                    if (data) {
                        return data._doc;
                    }
                    return null;
                })
        }
        catch (err) {
            return Promise.reject(err);
        }
    },

    add: function (lordid, pray) {
        var id;
        try {
            id = ObjectID(lordid);
            return userModel.findOne({_id: id})
                .then(function (user) {
                    if (!user)
                        return Promise.reject('The user with id[' + lordid + '] is not found!');
                    var userDoc = user._doc;
                    var data = {
                        prayer: userDoc._id,
                        context: pray
                    }
                    logger.debug("data to be added to prays is:" + JSON.stringify(data));
                    return new prayModel(data).save();
                })
                .then(function (pray) {
                    return pray._doc;
                });
        }
        catch (err) {
            return Promise.reject(err);
        }
    },

    praysToPrint: function () {
        var docs = [];
        return prayModel.find({printed: false})
            .sort({date: -1})
            .exec()
            .then(function (data) {
                data.forEach(function (item) {
                    docs.push(item._doc);
                });
                return docs;
            })
    },
    setAllPrinted: function () {
        var conditions = {printed: false}
            , update = {printed: true}
            , options = {multi: true};

        return new Promise(function (resolve, reject) {
            return prayModel.update(conditions, update, options, function callback(err, rows) {
                if(err) return reject(err);
                return resolve(rows);
            });
        });
    }
};
