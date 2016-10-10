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

module.exports = {
    index: function (req, res) {
        var openid = "o0ghywcfW_2Dp4oN-7NADengZAVM",
        //opendId = weapp.getOpenid(req.query.code, function(err, openId){}),  //TODO:当使用正式公众号时需动态获取OpenId
            transId = req.query.transId,
            transName = decodeURIComponent(req.query.transName),
            amount = req.query.amount;

        applyVirtueOpenId(transId, openid, function (err) {
            if (err) {
                logger.error(err);
                renderPaymentFail(res);
                return;
            }
            var prepayOrder = newPrepayOrder(openid, transId, transName, amount);
            pay(prepayOrder, res);
        });

        //--------------------------------------------------------
        function applyVirtueOpenId(transId, openid, callback) {
            //TODO: 用findById
            Virtue.findOne({"_id": ObjectID(transId)}, function (err, virtue) {
                if (err) {
                    logger.error(err);
                    callback(err);
                    return;
                }

                if (!virtue) {
                    var errmsg = "更新交易记录openid时出错：未找到标识为" + transId + "的交易记录。";
                    logger.error(errmsg);
                    callback(errmsg);
                    return;
                }

                try {
                    virtue.openid = openid;
                    virtue.save();  //TODO:应该写成callback形式
                    callback(null);
                }
                catch (e) {
                    logger.error("更新交易记录openid时出错。" + e);
                    callback(e);
                }
            });
        }

        function newPrepayOrder(openid, transId, transName, amount) {
            return {
                out_trade_no: transId,
                body: transName,
                detail: transName,
                notify_url: "http://121.41.93.210/jingyin/manjusri/pay/notify",
                openid: openid,
                spbill_create_ip: "121.41.93.210",
                total_fee: amount,
                attach: "静音"
            };
        }

        function pay(prepayOrder, res) {
            weapp.getPrepayId(prepayOrder, function (err, prepayId) {
                if (err) {
                    logger.debug("创建预支付失败:" + err);
                    renderPaymentFail(res);
                    return;
                }

                logger.debug("创建预支付成功，prepay_id:" + prepayId);

                weapp.getPayData(prepayId, function (payData) {
                    payData.success = true;
                    logger.debug("准备前端H5支付参数:" + JSON.stringify(payData));
                    res.render('wechat/payment', payData);
                })
            });
        }

        function renderPaymentFail(res) {
            res.render('payment', {"success": false});
        }
    },
    payNotify: function (req, res) {
        var body = "";
        req.on("data", function (chunk) {
            body += chunk;
        });
        req.on("end", function () {
            parsePayNotify(body, function (err, result) {
                logger.debug("解析支付结果通知:" + JSON.stringify(result));
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