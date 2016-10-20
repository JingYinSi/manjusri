var querystring = require('querystring'),
    XML = require('pixl-xml'),
    js2xmlparser = require('js2xmlparser'),
    Virtue = require('./models/virtue');

var log4js = require('log4js');
log4js.configure("log4js.conf", {reloadSecs: 300});
var logger = log4js.getLogger();
var weapp = require('../../modules/weapp')(({
    appid: "wx76c06da9928cd6c3",
    appsecret: "f4d498d87cf8641b83671a533c3999ec",
    mch_id: "1364986702",
    mch_key: "womendoushiwutaishanjingyinsidet"
}));
const weixin = require('../weixin').weixin;

module.exports = {
    index: function (req, res) {
        weixin.getOpenId(req.query.code, function (err, openId) {
            var transId = req.query.transId,
                transName = decodeURIComponent(req.query.transName),
                amount = req.query.amount;

            Virtue.applyVirtue(transId, openId, function (err, virtue) {
                if (err) {
                    logger.error(err);
                    return;
                }
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
                    logger.debug('db state is updated....');
                    responseOK(res);
                });
            }
        });

        function responseOK(res) {
            var responseBodyXML = js2xmlparser.parse("xml", {
                return_code: "SUCCESS",
                return_msg: "OK"
            });
            logger.debug("response to notification from weixin payment:" + responseBodyXML);
            res.end(responseBodyXML);
        }
    }
};
