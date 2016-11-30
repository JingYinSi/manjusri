/**
 * Created by clx on 2016/11/29.
 */
var Promise = require('bluebird'),
    httpRequest = require('./httprequest');

var config;

function Weixin() {
}

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
}

Weixin.prototype.getOpenId = function (code) {
    return new Promise(function (resolve, reject) {
        var url = config.getUrlToGetOpenId(code);
        return httpRequest.concat({url: url, json: true})
            .then(function (data) {
                return resolve(data.openid);
            }, function (err) {
                return reject(err);
            });
    });
}

Weixin.prototype.getUserInfoByOpenId = function (openid) {
    return this.getAccessToken()
        .then(function (token) {
            var url = config.getUrlToGetUserInfo(token, openid);
            return httpRequest.concat({url:url, json:true})
        });
}

module.exports = function (configObj) {
    config = configObj;
    return new Weixin();
}