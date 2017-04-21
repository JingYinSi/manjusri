var linkages = require("../rests"),
    virtuesModule = require('../modules/virtues'),
    partsModule = require('../modules/parts'),
    createResponseWrap = require('../../modules/responsewrap'),
    usersModule = require('../modules/users'),
    praysModule = require('../modules/prays'),
    mongoose = require('mongoose'),
    redirects = require('./redirects'),
    wx = require('../weixin');

var log4js = require('log4js');
log4js.configure("log4js.conf", {reloadSecs: 300});
var logger = log4js.getLogger();

//TODO:当用户更新微信头像等信息时，应能使数据同微信同步
//TODO:将manjusriPages.js并入manjusri.js中
var dealwithVirtue = function (type, req, res) {
    var view = type === "daily" ? 'manjusri/dailyVirtue' : 'manjusri/suixi';
    var res = createResponseWrap(res);
    return virtuesModule.lastVirtuesAndTotalCount(type, 30)
        .then(function (data) {
            data.menu = linkages.getMainMenuLinkages();
            return res.render(view, data);
        })
        .catch(function (err) {
            return res.setError(500, null, err);
        });
}

module.exports = {
    home: function (req, res) {
        var viewData = {
            linkages: {
                dailyVirtue: linkages.getLink("dailyVirtue"),
                suixi: linkages.getLink("suixi"),
                pray: linkages.getLink('pray'),
            },
            menu: linkages.getMainMenuLinkages()
        }
        return res.render('manjusri/index', viewData);
    },

    dailyVirtue: function (req, res) {
        return dealwithVirtue('daily', req, res);
    },

    suixi: function (req, res) {
        return dealwithVirtue('suixi', req, res);
    },

    jiansi: function (req, res) {
        var res = createResponseWrap(res);
        return partsModule.listPartsOnSale()
            .then(function (parts) {
                    var view = {
                        daily: linkages.getLink("dailyVirtue"),
                        suixi: linkages.getLink("suixi"),
                        menu: linkages.getMainMenuLinkages(),
                        parts: []
                    };
                    parts.forEach(function (item) {
                        var link = linkages.getLink("trans", {partId: item._id});
                        delete item._id;
                        item.url = link;
                        view.parts.push(item);
                    })
                    return res.render('manjusri/jiansi', view);
                }, function (err) {
                    return res.setError(500, null, err);
                }
            );
    },

    pray: function (req, res) {
        var code = 500;
        var errmsg;
        var resWrap = createResponseWrap(res);
        if (!req.session || !req.session.user)
            return resWrap.setError(400);
        var openid = req.session.user.openid;
        //var openid = 'o0ghywcfW_2Dp4oN-7NADengZAVM';

        var lordid, viewData;
        return usersModule.findByOpenid(openid)
            .then(function (user) {
                if (!user) {
                    errmsg = "the user with openid[" + openid + "] not exists!!!";
                    logger.error(errmsg);
                    code = 400;
                    return Promise.reject(errmsg);
                }
                lordid = user._id;
                return praysModule.countTimesOfPrays(lordid);
            })
            .then(function (data) {
                var selflink = linkages.getLink('pray');
                var url = wx.weixinConfig.wrapUrlWithSitHost(selflink);
                viewData = {
                    data: data,
                    share: {
                        title: '填写祈福卡', // 分享标题
                        desc: '向五台山文殊菩萨许个愿！', // 分享描述
                        link: url,  // 分享链接
                        imgUrl: wx.weixinConfig.getShareLogoImage(), // 分享图标
                    },
                    self: selflink,
                    links: {
                        addPray: linkages.getLink('lordPrays', {id: lordid})
                    },
                    menu: linkages.getMainMenuLinkages()
                };
                //return wx.weixinService.generateShareConfig(url);
            })
            .then(function (shareConfig) {
                viewData.shareConfig = shareConfig;
                logger.debug("view data of pray page:" + JSON.stringify(viewData));
                return res.render('manjusri/pray', viewData);
            })
            .catch(function (err) {
                logger.debug("error:" + err);
                return resWrap.setError(code, errmsg, err);
            })
    },

    lordVirtues: function (req, res) {
        var viewdata, virtues;
        var resWrap = createResponseWrap(res);
        if (!req.session || !req.session.user)
            return resWrap.setError(400);
        var openid = req.session.user.openid;
        //var openid = 'o0ghywcUHxUdazzXEBvYPxU1PVPk';
        //var openid = 'o0ghywcfW_2Dp4oN-7NADengZAVM';
        //var token = sess.user.access_token;
        var errmsg;
        return usersModule.findByOpenid(openid)
            .then(function (lord) {
                if (!lord) {
                    errmsg = "The User with openid(" + openid + ") not exists?";
                    logger.error(errmsg);
                    return Promise.reject(errmsg);
                }
                viewdata = {lord: lord};
                return virtuesModule.listLordVirtues(lord._id);
            })
            .then(function (virtues) {
                viewdata.virtues = virtues;
                viewdata.links = {
                    profile: linkages.getLink('profile', {openid: openid})
                }
                viewdata.menu = linkages.getMainMenuLinkages();
                return res.render('manjusri/me', viewdata);
            })
            .catch(function (err) {
                logger.debug("error:" + err);
                return resWrap.setError(500, errmsg, err);
            });
    },

    lordProfile: function (req, res) {
        //var resWrap = createResponseWrap(res);
        var openid = req.params.openid;
        if (req.session.user.openid !== openid) {
            return redirects.toHome(req, res);
        }
        return usersModule.findByOpenid(openid)
            .then(function (lord) {
                return res.render('manjusri/info', lord);
            })
            .catch(function (err) {
                return resWrap.setError(500, null, err);
            })
    },
};

