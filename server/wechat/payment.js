var Virtue = require('./models/virtue'),
    weixin = require('../weixin').weixin,
    XML = require('pixl-xml'),
    responseWrapFactory = require('../../modules/responsewrap');

var log4js = require('log4js');
log4js.configure("log4js.conf", {reloadSecs: 300});
var logger = log4js.getLogger();

module.exports = {
    index: function (req, res) {
        var resWrap = responseWrapFactory(res);
        var code = req.query.code;
        if(!code){
            logger.debug("Is request from weixin? there is something wrong, code is undefined");
            resWrap.setStatus(400);
            return;
        };
        weixin.getOpenId(req.query.code, function (err, trader) {
            if(err){
                resWrap.setStatus(400);
                return;
            }
            var trans = {
                trader: trader,
                details:{
                    subject: req.query.subject,
                    num: req.query.num,
                    price: req.query.price
                },
                amount: req.query.amount,
                giving: req.query.giving
            };

            Virtue.placeVirtue(trans, function (err, virtue) {
                if (err) {
                    logger.error(err);
                    var code = (err.errors) ? 400 : 502;
                    resWrap.setStatus(code);
                    return;
                }
                var transId = virtue._id.toString();
                weixin.prePay(trader, transId, trans.details.subject, trans.amount*100, function (err, payData) {
                    if(err){
                        resWrap.setStatus(502);
                        return;
                    }
                    logger.debug("Pay data to be sent to H5:" + JSON.stringify(payData));
                    //payData.success = true;  //TODO: 应该可以去掉????
                    resWrap.render('wechat/payment', payData);
                })
            });
        });
    },

    payNotify: function (req, res) {
        var body = "";
        req.on("data", function (chunk) {
            body += chunk;
        });
        req.on("end", function () {
            var payment = weixin.parsePaymentNotification(body);
            if(payment.pass()){
                logger.debug('success of payment ...');
                Virtue.havePayed(payment.getOutTradeNo(), function () {
                    var reply = payment.replyOK();
                    res.end(reply);
                });
            }
        });
    },

    result: function (req, res) {
        res.render('wechat/paymentResult');
    }
};

