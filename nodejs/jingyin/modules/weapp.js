/**
 * Created by sony on 2016/9/18.
 */
var https = require("https"),
    wepay = require('./wepay'),
    js2xmlparser = require('js2xmlparser'),
    parseStringToJs = require('xml2js').parseString;
var log4js = require('log4js');
log4js.configure("log4js.conf", {reloadSecs: 300});
var logger = log4js.getLogger();

module.exports = function (config) {
    return {
        appid: config.appid,
        appsecret: config.appsecret,
        mch_id: config.mch_id,
        mch_key: config.mch_key,
        oauth2BaseURL: "https://open.weixin.qq.com/connect/oauth2/authorize",
        parseOath2RedirectURL: function (redirect_uri) {
            var appid = "wxc93a54d2d6e5b682";//todo:正式公众号暂时未配置网页授权，将来需要删除
            return this.oauth2BaseURL + "?appid=" + appid + "&redirect_uri=" + redirect_uri + "&response_type=code&scope=snsapi_base#wechat_redirect";
        },
        apiBaseURL: "https://api.weixin.qq.com/sns/oauth2/",
        getOpenid: function (code, successFn) {
            var url = this.apiBaseURL + "access_token?appid=" + this.appid + "&secret=" + this.appsecret + "&code=" + code + "&grant_type=authorization_code";
            https.get(url, function (res) {
                var str = '', resp;
                res.on('data', function (data) {
                    str += data;
                });
                res.on('end', function () {
                    console.log("获得用户openid:" + str);
                    try {
                        resp = JSON.parse(str);
                        successFn(resp.openid);
                    } catch (e) {
                        //return errorRender(res, '解析远程JSON数据错误', str);
                    }
                });
            });
        },
        createNonceStr: function () {
            return Math.random().toString(36).substr(2, 15);
        },
        createTimeStamp: function () {
            return parseInt(new Date().getTime() / 1000) + '';
        },
        getPrepayId: function (prepayOrder, callback) {
            logger.debug("预支付JSON数据:" + JSON.stringify(prepayOrder));
            preparePrepayOrderData.call(this);
            var prepayOrderXML = js2xmlparser.parse("xml", prepayOrder);
            logger.debug("预支付XML数据:" + prepayOrderXML);
            var options = {
                hostname: "api.mch.weixin.qq.com",
                port: "443",
                path: "/pay/unifiedorder",
                method: "POST",
                headers: {
                    'Content-Type': 'application/xml',
                    "Content-Length": Buffer.byteLength(prepayOrderXML)
                }
            };

            https.request(options,
                function (res) {
                    var str = '';
                    res.on('data', function (data) {
                        str += data;
                    });
                    res.on('end', function () {
                        logger.debug("来自微信支付接口的预支付数据生成结果:" + str);
                        parseStringToJs(str, function (err, result) {
                            var data = result.xml;
                            for (var p in data) {
                                data[p] = data[p][0];
                            }

                            data.isSuccess = function(){
                                return this.return_msg == 'OK' &&this.result_code =='SUCCESS';
                            };

                            if(data.isSuccess()){
                                callback(null, data.prepay_id);
                            }else{
                                callback(data.err_code_des, null);
                            }
                        });
                    });
                }).write(prepayOrderXML);

            //-----------------------------------------------------------------------
            function preparePrepayOrderData() {
                prepayOrder.appid = this.appid;
                prepayOrder.mch_id = this.mch_id;
                if (!prepayOrder.nonce_str)
                    prepayOrder.nonce_str = this.createNonceStr();
                if (!prepayOrder.trade_type)
                    prepayOrder.trade_type = "JSAPI";
                prepayOrder.sign = wepay.signMD5(prepayOrder, this.mch_key);
            }
        },
        getPayData: function (prepayId, successFn) {
            var appId = this.appid;
            var payData = {
                "appId": appId,
                "timeStamp": this.createTimeStamp(),
                "nonceStr": this.createNonceStr(),
                "package": "prepay_id=" + prepayId,
                "signType": "MD5"
            };
            payData.paySign = wepay.signMD5(payData, this.mch_key);
            payData.prepay_id = prepayId;
            successFn(payData);
        },

        signMD5: function (data) {
            return wepay.signMD5(data, this.mch_key)
        }
    };
};
