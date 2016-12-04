var Virtue = require('./models/virtue'),
    userModel = require('./models/user'),
    usersModule = require('../modules/users'),
    wx = require('../weixin').weixinService,
    virtues = require('../modules/virtues'),
    Promise = require('bluebird'),
    weixin = require('../weixin').weixin,
    responseWrapFactory = require('../../modules/responsewrap');

var log4js = require('log4js');
log4js.configure("log4js.conf", {reloadSecs: 300});
var logger = log4js.getLogger();

module.exports = {
    toPay: function (req, res) {
        var resWrap = responseWrapFactory(res);
        var code = req.query.code;
        if (!code) {
            return resWrap.setError(400, null, new Error('code is not found in query'));
        }
        var virtueId = req.query.virtue;
        if (!virtueId) {
            return resWrap.setError(400, null, new Error('virtue is not found in query'));
        }
        var openId, subjectName, amount;
        var tasks = [
            wx.getOpenId(code)
                .then(function (data) {
                    return openId = data;
                }),
            virtues.findNewVirtueById(virtueId)
                .then(function (doc) {
                    if(!doc) return Promise.reject(new Error('The virtue[id=' + virtueId + '] is not found'));

                    subjectName = doc.subject.name;
                    amount = doc.amount;
                })];
        return Promise.all(tasks)
            .then(function () {
                return wx.prepay(openId, virtueId, subjectName, amount);
            })
            .then(function (payData) {
                logger.debug("Pay data to be sent to H5:" + JSON.stringify(payData));
                resWrap.render('wechat/payment', {
                    openId: openId,
                    virtue: virtueId,
                    payData: payData
                });
            })
            .catch(function (err) {
                return resWrap.setError(400, null, err);
            });
    },

    pay: function (req, res) {
        var resWrap = responseWrapFactory(res);
        var code = req.query.code;
        if (!code) {
            return resWrap.setError(400);
        }

        //TODO:重构weixin.getOpenId
        weixin.getOpenId(req.query.code, function (err, trader) {
            if (err) {
                resWrap.setError(400);
                return;
            }
            logger.debug('info for test: open id is:' + trader);
            var transId = req.query.virtue;
            Virtue.findById(transId)
                .populate('subject', 'name')
                .exec(function (err, virtue) {
                    if (err) {
                        logger.error(err);
                        var code = (err.errors) ? 400 : 502;
                        resWrap.setError(code);
                        return;
                    }

                    //TODO:重构weixin.prePay
                    var name = virtue.subject.name;
                    var amount = Math.round(virtue.amount * 100);
                    logger.debug('Prepay parameters:\n' + JSON.stringify({
                            trader: trader,
                            transId: transId,
                            name: name,
                            amount: amount
                        }));
                    weixin.prePay(trader, transId, name, amount, function (err, payData) {
                        if (err) {
                            logger.error('微信预支付错:' + err.message);
                            resWrap.setError(502);
                            return;
                        }
                        logger.debug("Pay data to be sent to H5:" + JSON.stringify(payData));
                        resWrap.render('wechat/payment', {
                            openId: trader,
                            virtue: transId,
                            payData: payData
                        });
                    });
                });
        });
    },

    result: function (req, res) {
        res.render('wechat/paymentResult');
    },

    paidNotify: function (req, res) {
        var notify = weixin.parsePaymentNotification(req.body.xml);
        logger.info('Paid notify from weixin:\n', JSON.stringify(notify));
        userModel.findOne({openid: notify.openid}, function (err, user) {
            if (!user) {
                logger.info('Can not found user with openid:' + notify.openid);
                usersModule.register(notify.openid, function (err, userAdded) {
                    if (err) {
                        logger.error('register user failed:' + err);
                        return;
                    }
                    doPay(userAdded);
                });
                return;
            }
            doPay(user);
        });
        function doPay(user) {
            Virtue.pay(notify.out_trade_no, user.id, notify.transaction_id, function (err, virtue) {
                res.end(notify.replyOK());
            });
        }
    }
};

