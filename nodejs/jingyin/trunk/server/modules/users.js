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

Users.prototype.register = function (accessToken, openId) {
    return UserModel.findOne({openid: openId})
        .then(function (user) {
            if (user && user.name && user.subscribe) {
                logger.debug('The user with openid[' + openId + '] is already registered!');
                return Promise.resolve(user);
            }
            (accessToken ? weixinService.getUserInfoByOpenIdAndToken(accessToken, openId)
                : weixinService.getUserInfoByOpenId(openId))
                .then(function (userInfo) {
                    logger.debug('User info from weixin:\n' + JSON.stringify(userInfo));
                    var model = user;
                    if (!model) {
                        var data = {
                            name: userInfo.nickname,
                            openid: userInfo.openid,
                            img: userInfo.headimgurl,
                            city: userInfo.city,
                            province: userInfo.province,
                            sex: userInfo.sex,
                            subscribe: userInfo.subscribe_time
                        }
                        model = new UserModel(data);
                    }

                    return model.save();
                });
        });
}

module.exports = new Users();
