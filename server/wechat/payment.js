var querystring = require('querystring'),
    js2xmlparser = require('js2xmlparser'),
    Virtue = require('./models/virtue');

var log4js = require('log4js');
log4js.configure("log4js.conf", {reloadSecs: 300});
var logger = log4js.getLogger();
const weixin = require('../weixin').weixin;

module.exports = {
    index: function (req, res) {
        var code = req.query.code;
        if(!code){
            logger.error("there is something wrong, code is undefined");
            res.status(400);
            res.end();
            return;
        }
        weixin.getOpenId(req.query.code, function (err, openId) {
            var /*transId = req.query.transId,*/
                transName = decodeURIComponent(req.query.transName),
                amount = req.query.amount;

            Virtue.placeVirtue(openId, amount, function (err, virtue) {
                if (err) {
                    logger.error(err);
                    return;
                }
                weixin.prePay(openId, virtue._id.toString(), transName, amount, function (payData) {
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
    }
};

