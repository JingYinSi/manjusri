var linkages = require("../rests"),
    virtuesModule = require('../modules/virtues'),
    partsModule = require('../modules/parts'),
    createResponseWrap = require('../../modules/responsewrap'),
    usersModule = require('../modules/users'),
    praysModule = require('../modules/prays'),
    lessonsModule = require('../modules/lessons'),
    mongoose = require('mongoose'),
    redirects = require('./redirects'),
    wx = require('../weixin');

var log4js = require('log4js');
log4js.configure("log4js.conf", {reloadSecs: 300});
var logger = log4js.getLogger();

//TODO:当用户更新微信头像等信息时，应能使数据同微信同步
//TODO:将manjusriPages.js并入manjusri.js中
var dealwithVirtue = function (type, req, res) {
    var view, viewdata, selflink, share;
    if (type === "daily") {
        view = 'manjusri/dailyVirtue';
        selflink = linkages.getLink('dailyVirtue');
        share = {
            title: '日行一善', // 分享标题
            desc: '捐助五台山静音寺建设，圆满福慧资粮！', // 分享描述
            link: wx.weixinConfig.wrapUrlWithSitHost(linkages.getLink('dailyVirtue')),  // 分享链接
            imgUrl: wx.weixinConfig.getShareLogoImage(), // 分享图标
        };
    } else {
        view = 'manjusri/suixi';
        selflink = linkages.getLink('suixi');
        share = {
            title: '随喜五台山静音寺建设', // 分享标题
            desc: '五台山静音寺文殊禅林是以培养僧才为核心，弘扬人间佛教的道场！', // 分享描述
            link: wx.weixinConfig.wrapUrlWithSitHost(linkages.getLink('suixi')),  // 分享链接
            imgUrl: wx.weixinConfig.getShareLogoImage(), // 分享图标
        };
    }
    var res = createResponseWrap(res);
    return virtuesModule.lastVirtuesAndTotalCount(type, 30)
        .then(function (data) {
            viewdata = data;
            viewdata.links = {
                self: selflink,
                prepay: linkages.getLink('prepay'),
            }
            viewdata.share = share;
            viewdata.menu = linkages.getMainMenuLinkages();
            return wx.weixinService.generateShareConfig(wx.weixinConfig.wrapUrlWithSitHost(req.url));
        })
        .then(function (shareConfig) {
            viewdata.shareConfig = shareConfig;
            return res.render(view, viewdata);
        })
        .catch(function (err) {
            return res.setError(500, null, err);
        });
}

module.exports = {
    home: function (req, res) {
        var res = createResponseWrap(res);
        var viewData = {
            linkages: {
                dailyVirtue: linkages.getLink("dailyVirtue"),
                suixi: linkages.getLink("suixi"),
                pray: linkages.getLink('pray'),
            },
            share: {
                title: '静音寺.文殊禅林', // 分享标题
                desc: '传承正法，培养僧才，实修实证，弘扬人间佛教，共建人间净土！', // 分享描述
                link: wx.weixinConfig.wrapUrlWithSitHost(linkages.getLink('home')),  // 分享链接
                imgUrl: wx.weixinConfig.getShareLogoImage(), // 分享图标
            },
            menu: linkages.getMainMenuLinkages()
        }
        var url = wx.weixinConfig.wrapUrlWithSitHost(req.url);
        logger.debug("The url of the share page is: " + url);
        return wx.weixinService.generateShareConfig(url)
            .then(function (shareConfig) {
                viewData.shareConfig = shareConfig;
                return res.render('manjusri/index', viewData);
            })
            .catch(function (err) {
                return res.setError(500, null, err);
            });
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
                return wx.weixinService.generateShareConfig(wx.weixinConfig.wrapUrlWithSitHost(req.url));
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

    lesson: function (req, res) {
        var code = 500;
        var errmsg;
        var resWrap = createResponseWrap(res);

        if (!req.session || !req.session.user)
            return resWrap.setError(400);
        var openid = req.session.user.openid;
        //var openid = 'o0ghywcfW_2Dp4oN-7NADengZAVM';

        var lordid;
        var viewData = {
            menu: linkages.getMainMenuLinkages(),
        };
        var resWrap = createResponseWrap(res);
        return usersModule.findByOpenid(openid)
            .then(function (user) {
                if (!user) {
                    errmsg = "the user with openid[" + openid + "] not exists!!!";
                    logger.error(errmsg);
                    code = 400;
                    return Promise.reject(errmsg);
                }
                lordid = user._id;
                return lessonsModule.listLessons(lordid);
            })
            .then(function (lessons) {
                    var list = [];
                    lessons.forEach(function (item) {
                        var lesson = Object.assign({
                            links: {
                                self: linkages.getLink("lessonPractices", {lordid: lordid, lessonid: item.lesson._id}),
                            }
                        }, item);
                        list.push(lesson);
                    });
                    viewData.data = list;
                    return wx.weixinService.generateShareConfig(wx.weixinConfig.wrapUrlWithSitHost(req.url));
                }
            )
            .then(function (shareConfig) {
                viewData.share = {
                    title: '共修', // 分享标题
                    desc: '众人共修之功德是各人所修功德的总和！', // 分享描述
                    link: wx.weixinConfig.wrapUrlWithSitHost(linkages.getLink('lesson')),  // 分享链接
                    imgUrl: wx.weixinConfig.getShareLogoImage(), // 分享图标
                };
                viewData.shareConfig = shareConfig;
                logger.debug("The viewdata of lesson is: " + JSON.stringify(viewData));
                return res.render('manjusri/lesson', viewData);
            })
            .catch(function (err) {
                logger.debug("lesson page handler error:" + err);
                return resWrap.setError(500, null, err);
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

        var lordid;
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
                lordid = lord._id;
                return virtuesModule.listLordVirtues(lordid, null, 5);
            })
            .then(function (virtues) {
                viewdata.virtues = virtues;
                viewdata.links = {
                    profile: linkages.getLink('profile', {openid: openid}),
                    daily: linkages.getLink('dailyVirtue'),
                    suixi: linkages.getLink('suixi'),
                }
                return lessonsModule.listMyLessons(lordid);
            })
            .then(function (list) {
                var lessons = [];
                list.forEach(function (item) {
                    var lesson = Object.assign({
                        links: {
                            self: linkages.getLink("lessonPractices", {lordid: lordid, lessonid: item.lesson._id}),
                        }
                    }, item);
                    lessons.push(lesson);
                });
                viewdata.lessons = lessons;
                viewdata.menu = linkages.getMainMenuLinkages();
                logger.debug("The viewdata of lordvirtues is: " + JSON.stringify(viewdata));
                return res.render('manjusri/me', viewdata);
            })
            .catch(function (err) {
                logger.debug("error:" + err);
                return resWrap.setError(500, errmsg, err);
            });
    }
    ,

//TODO:实现点击查看更多内容
    lordProfile: function (req, res) {
        var resWrap = createResponseWrap(res);
        var openid = req.params.openid;
        if (req.session.user.openid !== openid) {
            return redirects.toHome(req, res);
        }
        var viewdata = {
            links: {
                self: linkages.getLink('profile', openid),
                lord: linkages.getLink('me'),
            },
            menu: linkages.getMainMenuLinkages(),
        };

        return usersModule.findByOpenid(openid)
            .then(function (lord) {
                viewdata.data = lord;
                return res.render('manjusri/info', viewdata);
            })
            .catch(function (err) {
                return resWrap.setError(500, null, err);
            })
    }
    ,
}
;

