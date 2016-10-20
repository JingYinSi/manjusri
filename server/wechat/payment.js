var querystring = require('querystring'),
    ObjectID = require("mongodb").ObjectID,
    js2xmlparser = require('js2xmlparser'),
    parseStringToJs = require('xml2js').parseString,
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
        logger.debug("we are enter payment....");
        //var openid = "o0ghywcfW_2Dp4oN-7NADengZAVM";
        weixin.getOpenId(req.query.code, function (err, openId) {
            logger.debug("The openId is obtained from weixin:" + openid);
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
        }); //TODO:当使用正式公众号时需动态获取OpenId
    },
    payNotify: function (req, res) {
        var body = "";
        req.on("data", function (chunk) {
            body += chunk;
        });
        req.on("end", function () {
            parsePayNotify(body, function (err, result) {
                logger.debug("Notification the result of payment:" + JSON.stringify(result));
                if (result.pass()) {
                    applyVirtuePaid(result.out_trade_no, function () {
                    });
                } else {
                }
                responseOK(res);
            });
        });

        //---------------------------------------------------------

        function parsePayNotify(payNotifyXml, callback) {
            logger.debug("支付结果通知:" + payNotifyXml);

            parseStringToJs(payNotifyXml, function (err, result) {
                var data = result.xml;
                for (var p in data) {
                    data[p] = data[p][0];
                }

                data.isSuccess = function () {
                    return this.result_code == "SUCCESS" && this.return_code == "SUCCESS";
                };

                data.clone = function () {
                    return JSON.parse(JSON.stringify(this));
                };

                data.verifySign = function () {
                    var dataToSign = this.clone();
                    delete dataToSign.sign;
                    var sign = weapp.signMD5(dataToSign);
                    return this.sign == sign;
                };

                data.pass = function () {
                    if (this.isSuccess() == false)return false;
                    return this.verifySign();
                };

                callback(err, result.xml);
            });
        }

        function applyVirtuePaid(transId, callback) {
            Virtue.findOne({"_id": ObjectID(transId)}, function (err, virtue) {
                if (err) {
                    logger.error(err);
                    return;
                }
                if (virtue == null) {
                    logger.error("更新交易记录为已支付状态时出错：未找到标识为" + transId + "的交易记录。");
                    return;
                }
                virtue.state = "1";
                virtue.save();
                callback();
            });
        }

        function responseOK(res) {
            var responseBodyXML = js2xmlparser.parse("xml", {
                return_code: "SUCCESS",
                return_msg: "OK"
            });
            logger.debug("响应微信支付结果通知，响应内容为:" + responseBodyXML);
            res.end(responseBodyXML);
        }
    }
};

