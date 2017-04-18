/**
 * Created by clx on 2016/11/29.
 *
 */
var Promise = require('bluebird'),
    XML = require('pixl-xml'),
    httpRequest = require('./httprequest');
var log4js = require('log4js');
log4js.configure("log4js.conf", {reloadSecs: 300});
var logger = log4js.getLogger();

var config;

var Weixin = function () {
};

Weixin.prototype.getAccessToken = function () {
    return new Promise(function (resolve, reject) {
        var url = config.getUrlToGetAccessToken();
        return httpRequest.concat({url: url, json: true})
            .then(function (data) {
                return resolve(data.access_token);
            }, function (err) {
                return reject(err);
            });
    })
};

Weixin.prototype.getOpenId = function (code) {
    var url = config.getUrlToGetOpenId(code);
    return httpRequest.concat({url: url, json: true});
};

Weixin.prototype.getUserInfoByOpenId = function (openid) {
    return this.getAccessToken()
        .then(function (token) {
            var url = config.getUrlToGetUserInfo(token, openid);
            return httpRequest.concat({url: url, json: true})
        });
};

/**
 * 通过网页授权获取用户基本信息
 * @param token access_token
 * @param openid openid
 */
Weixin.prototype.getUserInfoByOpenIdAndToken = function (token, openid) {
    var url = config.getSnsUrlToGetUserInfo(token, openid);
    return httpRequest.concat({url: url, json: true});
};

Weixin.prototype.prepay = function (openId, transId, transName, amount) {
    logger.debug("Start to build weixin prepay request .....");
    var opt = config.getPrepayRequestOption(openId, transId, transName, amount);
    logger.debug("The built and will be sent Weixin prepay request is: " + JSON.stringify(opt));
    return httpRequest.concat(opt)
        .then(function (data) {
            var str = data.toString();
            logger.debug("Weixin prepay process gave back a response, the Prepay xml from weixin prepay API is:\n" + str);
            var doc = XML.parse(str);
            if (doc.return_msg === 'OK' && doc.result_code === 'SUCCESS') {
                logger.debug("Weixin prepay is successful, we are going to build payment request data by prepay response....");
                var paydata = config.generatePayData(doc.prepay_id);
                logger.debug("The payment request data is built like this: " + JSON.stringify(paydata));
                return paydata;
            }
            logger.error("A failure is reported by Weixin prepay process .....");
            return Promise.reject(new Error(doc.err_code_desc));
        });
};

Weixin.prototype.generateShareConfig = function (url, callback) {
    var me = this;
    return this.getAccessToken()
        .then(function (token) {
            return me.getTicketForJsAPI(token).then(function (result) {
                var shareConfig = config.generateShareConfig(result.ticket, url);
                callback(shareConfig);
            });
        }, function (err) {
            logger.info('获得AccessToken失败:' + err)
        });
};

Weixin.prototype.getTicketForJsAPI = function (token) {
    var url = config.getTicketURLForJsApi(token);
    return httpRequest.concat({url: url, json: true})
};

module.exports = function (configObj) {
    config = configObj;
    return new Weixin();
};