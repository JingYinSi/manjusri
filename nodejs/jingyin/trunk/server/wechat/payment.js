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
        var code = req.query.transName;
        if(!code){
            resWrap.setStatus(400, 'transaction Type(transName) is not defined');
            return;
        };

        weixin.getOpenId(req.query.code, function (err, openId) {
            if(err){
                resWrap.setStatus(400);
                return;
            }
            var transName = decodeURIComponent(req.query.transName),
                amount = req.query.amount,
                target = decodeURIComponent((req.query.target));
            logger.debug("Redirected to payment:" + JSON.stringify({
                    transName: transName,
                    amount: amount,
                    targer: target
                }));
            Virtue.placeVirtue(openId, amount, function (err, virtue) {
                if (err) {
                    logger.error(err);
                    return;
                }
                var transId = virtue._id.toString();
                weixin.prePay(openId, transId, transName, amount, function (payData) {
                    logger.debug("Pay data to be sent to H5:" + JSON.stringify(payData));
                    payData.success = true;
                    res.render('wechat/payment', payData);
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
                    logger.debug("reply to weixin OK:\n" + reply);
                    res.end(reply);
                });
            }
        });
        logger.debug("body of payment result request:\n" + JSON.stringify(XML.parse(req.body)));
    },

    result: function (req, res) {
        res.render('wechat/paymentResult');
    }
};
