/**
 * Created by clx on 2016/11/3.
 */
var weixin = require('../weixin').weixin,
    UserModel = require('../wechat/models/user');

function Users() {
}
Users.prototype.register = function (openId, callback) {
    weixin.getUserInfoByOpenId(openId, function (err, userInfo) {
        UserModel.registerWeixinUser(userInfo, function (err, user) {
            callback(err, user);
        });
    });
}

module.exports = new Users();
