/**
 * Created by sony on 2016/10/12.
 */
var simpleget = require('simple-get'),
    js2xmlparser = require('js2xmlparser'),
    XML = require('pixl-xml'),
    request = require('request'),
    https = require('https'),
    md5 = require('md5');
var log4js = require('log4js');
log4js.configure("log4js.conf", {reloadSecs: 300});
var logger = log4js.getLogger();

module.exports = function (config) {
    this.apiBaseURL = config.apiBaseURL ||
        "https://api.weixin.qq.com/sns/oauth2/";
    this.appid = config.appId;
    this.appsecret = config.appSecret;
    this.oauth2BaseURL = config.oauth2BaseURL ||
        "https://open.weixin.qq.com/connect/oauth2/authorize";
    this.mch_id = config.mchId,
        this.mch_key = config.mchKey

    this.createNonceStr = function () {
        return Math.random().toString(36).substr(2, 15);
    }

    this.createTimeStamp = function () {
        return parseInt(new Date().getTime() / 1000) + '';
    }

    this.getOpenId = function (code, callback) {
        var url = this.apiBaseURL + "access_token?appid="
            + this.appid + "&secret=" + this.appsecret
            + "&code=" + code + "&grant_type=authorization_code";

        logger.debug("The Url for getting openid is:\n" + url);
        simpleget.concat(url, function (err, res, data) {
            if (err) logger.debug("There is a error when get openid:\n" + err);
            logger.debug("Data from weixin is:" + typeof data + "----" + data);
            var id = data.toJSON().openid;
            logger.debug("openid is:" + id);
            callback(null, id);
        });
    }

    this.wrapRedirectURLByOath2Way = function (url) {
        /*var appid = "wxc93a54d2d6e5b682";
         var wrapedUrl = this.oauth2BaseURL + "?appid=" + appid
         + "&redirect_uri=" + url + "&response_type=code&scope=snsapi_base#wechat_redirect";*/
        //todo:正式公众号暂时未配置网页授权，目前使用37行和38行代码测试，正式公众号网页授权设置后采用41和42行代码
        var wrapedUrl = this.oauth2BaseURL + "?appid=" + this.appid
            + "&redirect_uri=" + url + "&response_type=code&scope=snsapi_base#wechat_redirect";
        return wrapedUrl;
    }

    this.preparePrepayOrderXml = function (openId, transId, transName, amount) {
        var me = this;
        var prepay = {
            out_trade_no: transId,
            body: transName,
            detail: transName,
            notify_url: "http://jingyintemple.top/jingyin/manjusri/pay/notify",
            openid: openId,
            spbill_create_ip: "121.41.93.210",
            total_fee: amount,
            attach: "静音",
            appid: me.appid,
            mch_id: me.mch_id,
            nonce_str: me.createNonceStr(),
            trade_type: "JSAPI"
        }
        prepay.sign = this.signMD5(prepay, me.mch_key);
        return js2xmlparser.parse('xml', prepay);
    }

    this.sendPrepayRequest = function (prepayOrderXML, callback) {
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
                    var doc = XML.parse(str);
                    logger.debug("Prepay data from weixin API:" + JSON.stringify(doc));
                    if (doc.return_msg == 'OK' && doc.result_code == 'SUCCESS') {
                        callback(null, doc.prepay_id);
                    } else {
                        callback(doc.err_code_des, null);
                    }
                });
            }).write(prepayOrderXML);
    }

    this.prePay = function (openId, transId, transName, amount, callback) {
        var me = this;
        var prepayOrderXML = me.preparePrepayOrderXml(openId, transId, transName, amount);
        me.sendPrepayRequest(prepayOrderXML, function (err, prepayId) {
            var payData = {
                "appId": me.appid,
                "package": "prepay_id=" + prepayId,
                "timeStamp": me.createTimeStamp(),
                "nonceStr": me.createNonceStr(),
                "signType": "MD5"
            };
            payData.paySign = me.signMD5(payData, me.mch_key);
            payData.prepay_id = prepayId;
            callback(payData);
        })
    }

    this.signMD5 = function (data, key) {
        var keyvaluesort = function (data) {
            var keys = new Array();
            for (var k in data) {
                keys.push(k);
            }

            keys = keys.sort();
            var val = '';
            for (var i = 0; i < keys.length; i++) {
                if (i > 0) val = val + '&';
                val = val + keys[i] + '=' + data[keys[i]];
            }
            return val;
        }
        var tosign = keyvaluesort(data) + '&key=' + key;
        return md5(tosign).toUpperCase();
    }
    return this;
}
