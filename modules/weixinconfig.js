/**
 * Created by clx on 2016/11/29.
 */
var signMd5 = require('./weixinsignmd5'),
    js2xmlparser = require('js2xmlparser');

var nonceGen = function () {
    return Math.random().toString(36).substr(2, 15);
};
var timestampGen = function () {
    return parseInt(new Date().getTime() / 1000) + '';
};

var config, urlToGetAccessToken;
var apiBaseURL, oauth2BaseURL;
var appId, appSecret, mchId, mchKey;
var payServerIp, payNotifyUrl;


function WeixinConfig() {
}

WeixinConfig.prototype.setNonceGenerator = function (nonceGenerator) {
    nonceGen = nonceGenerator;
}

WeixinConfig.prototype.setTimestampGenerator = function (timestampGenerator) {
    timestampGen = timestampGenerator;
}

WeixinConfig.prototype.setSignMD5 = function (weixinSignMd5) {
    signMd5 = weixinSignMd5;
}

WeixinConfig.prototype.getUrlToGetAccessToken = function () {
    return urlToGetAccessToken;
}

WeixinConfig.prototype.getUrlToGetOpenId = function (code) {
    var url = apiBaseURL + "access_token?appid="
        + appId + "&secret=" + appSecret + "&code=" + code + "&grant_type=authorization_code";
    return url;
}

WeixinConfig.prototype.getUrlToGetUserInfo = function (token, openid) {
    var url = 'https://api.weixin.qq.com/cgi-bin/user/info?' +
        'access_token=' + token + '&openid=' + openid + '&lang=zh_CN';
    return url;
}

WeixinConfig.prototype.getPrepayRequestOption = function (openId, transId, transName, amount) {
    var order = {
        out_trade_no: transId,
        body: transName,
        detail: transName,
        notify_url: payNotifyUrl,
        openid: openId,
        spbill_create_ip: payServerIp,
        total_fee: Math.round(amount * 100),
        attach: "jingyin",
        appid: appId,
        mch_id: mchId,
        nonce_str: nonceGen(),
        trade_type: "JSAPI"
    };
    order.sign = signMd5(order, mchKey);
    //TODO:如何避免由于transName中包含不允许出现在XML中的字符而导致异常？
    var prepayOrderXML = js2xmlparser.parse('xml', order);
    var options = {
        url: 'https://api.mch.weixin.qq.com:443/pay/unifiedorder',
        method: 'POST',
        body: prepayOrderXML,
        headers: {
            'Content-Type': 'application/xml',
            "Content-Length": Buffer.byteLength(prepayOrderXML)
        }
    };
    return options;
}

WeixinConfig.prototype.generatePayData = function (prepayId) {
    var payData = {
        appId: appId,
        package: 'prepay_id=' + prepayId,
        timeStamp: timestampGen(),
        nonceStr: nonceGen(),
        signType: 'MD5'
    };
    payData.paySign = signMd5(payData, mchKey);
    payData.prepay_id = prepayId;
    return payData;
}

WeixinConfig.prototype.wrapRedirectURLByOath2Way = function (url) {
    /*var wrapedUrl = oauth2BaseURL + "?appid=" + appId
        + "&redirect_uri=" + url + "&response_type=code&scope=snsapi_base#wechat_redirect";*/
    var wrapedUrl = oauth2BaseURL + "?appid=" + appId
        + "&redirect_uri=" + url + "&response_type=code&scope=snsapi_userinfo#wechat_redirect";
    return wrapedUrl;
}

WeixinConfig.prototype.parsePaymentNotification = function (paydata) {
    var result = {
        pass: false,
        openId: paydata.openid,
        virtueId: paydata.out_trade_no,
        paymentNo: paydata.transaction_id,
        replyOK: function () {
            return js2xmlparser.parse("xml", {
                return_code: "SUCCESS",
                return_msg: "OK"
            });
        }
    }

    if (paydata.result_code === "SUCCESS" && paydata.return_code === "SUCCESS") {
        var tosign = Object.assign({}, paydata);
        delete tosign.sign;
        if (signMd5(tosign, mchKey) === paydata.sign)
            result.pass = true;
    }
    return result;
}

module.exports = function (configData) {
    apiBaseURL = configData.apiBaseURL;
    oauth2BaseURL = configData.oauth2BaseURL;
    appId = configData.appId;
    appSecret = configData.appSecret;
    mchId = configData.mchId;
    mchKey = configData.mchKey;
    payServerIp = configData.payServerIp;
    payNotifyUrl = configData.payNotifyUrl;

    urlToGetAccessToken = 'https://api.weixin.qq.com/cgi-bin/token?' +
        'grant_type=client_credential&appid=' + appId + '&secret=' + appSecret;
    return new WeixinConfig();
}