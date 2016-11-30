var Virtue = require('./models/virtue'),
    userModel = require('./models/user'),
    usersModule = require('../modules/users'),
    weixin = require('../weixin').weixin,
    responseWrapFactory = require('../../modules/responsewrap');

var log4js = require('log4js');
log4js.configure("log4js.conf", {reloadSecs: 300});
var logger = log4js.getLogger();

//TODO:重构payment
module.exports = {
    pay: function (req, res) {
        var resWrap = responseWrapFactory(res);
        var code = req.query.code;
        if (!code) {
            logger.debug("Is request from weixin? there is something wrong, code is undefined");
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
                    logger.debug('prePay data for test:\n' + JSON.stringify({
                            trader: trader,
                            transId: transId,
                            name: name,
                            amount: virtue.amount * 100
                        }));
                    weixin.prePay(trader, transId, name, virtue.amount * 100, function (err, payData) {
                        if (err) {
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
        //var notify = req.body.xml;
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

