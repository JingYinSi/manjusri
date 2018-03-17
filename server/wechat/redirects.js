/**
 * Created by clx on 2017/3/22.
 */
const wx = require('../weixin'),
    urlRegister = require('../rests');

var log4js = require('log4js');
var logger = log4js.getLogger();
logger.level = 'debug';

module.exports = {
    toLogin: function (req, res) {
        var url = urlRegister.getLink("login");
        url = wx.weixinConfig.wrapRedirectURLByOath2Way(url);
        //req.session.redirectToUrl = req.originalUrl;
        return res.redirect(url);
    },

    toProfile: function (openid, req, res) {
        var url = urlRegister.getLink("profile", {openid: openid});
        return res.redirect(url);
    },

    toHome: function (req, res) {
        var url = urlRegister.getLink("home");
        return res.redirect(url);
    }
}
