/**
 * Created by clx on 2016/11/3.
 */
var weixin = require('../weixin').weixin,
    weixinService = require('../weixin').weixinService,
    UserModel = require('../wechat/models/user');
var log4js = require('log4js');
log4js.configure("log4js.conf", {reloadSecs: 300});
var logger = log4js.getLogger();

function Users() {
}

Users.prototype.registerWeixinUser = function (openId) {
    return weixinService.getUserInfoByOpenId(openId)
        .then(function (userInfo) {
            logger.debug('User info from weixin:\n' + JSON.stringify(userInfo));
            return UserModel.registerWeixinUser(userInfo);
        });
}

Users.prototype.register = function (openId, callback) {
    weixin.getUserInfoByOpenId(openId, function (err, userInfo) {
        logger.debug('User info from weixin:\n' + JSON.stringify(userInfo));
        UserModel.registerWeixinUser(userInfo, function (err, user) {
            callback(err, user);
        });
    });
}

module.exports = new Users();
