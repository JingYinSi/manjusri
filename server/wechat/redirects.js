/**
 * Created by clx on 2017/3/22.
 */
const wx = require('../weixin'),
    urlRegister = require('../rests'),
    logger = require('@finelets/hyper-rest/app/Logger');

module.exports = {
    toLogin: function (req, res) {
        var url = urlRegister.getLink("login");
        url = wx.weixinConfig.wrapRedirectURLByOath2Way(url);
        //req.session.redirectToUrl = req.originalUrl;
        return res.redirect(url);
    },

    toProfile: function (openid, req, res) {
        var url = urlRegister.getLink("profile", {
            openid: openid
        });
        return res.redirect(url);
    },

    toHome: function (req, res) {
        var url = urlRegister.getLink("home");
        return res.redirect(url);
    }
}