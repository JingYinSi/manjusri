/**
 * Created by clx on 2016/11/3.
 */
var weixin = require('../weixin').weixin,
    weixinService = require('../weixin').weixinService,
    UserModel = require('../wechat/models/user'),
    Promise = require('bluebird');

var log4js = require('log4js');
log4js.configure("log4js.conf", {reloadSecs: 300});
var logger = log4js.getLogger();

function Users() {
}

Users.prototype.registerWeixinUser = function (openId) {
    return UserModel.findOne({openid: openId})
        .then(function (user) {
            if (user) {
                logger.debug('The user with openid[' + openId + '] is already registered!');
                return Promise.resolve(user);
            }
            return weixinService.getUserInfoByOpenId(openId)
                .then(function (userInfo) {
                    logger.debug('User info from weixin:\n' + JSON.stringify(userInfo));
                    var data = {
                        name: userInfo.nickname,
                        openid: userInfo.openid,
                        img: userInfo.headimgurl,
                        city: userInfo.city,
                        province: userInfo.province,
                        sex: userInfo.sex,
                        subscribe: userInfo.subscribe_time
                    }
                    var model = new UserModel(data);
                    return model.save();
                });
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
