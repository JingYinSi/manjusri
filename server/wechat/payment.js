var wx = require('../weixin').weixinService,
    wxConfig = require('../weixin').weixinConfig,
    virtues = require('../modules/virtues'),
    Promise = require('bluebird'),
    linkages = require("../rests"),
    responseWrapFactory = require('../../modules/responsewrap');

var log4js = require('log4js');
log4js.configure("log4js.conf", {reloadSecs: 300});
var logger = log4js.getLogger();

module.exports = {
    pay: function (req, res) {
        var resWrap = responseWrapFactory(res);
        var sess = req.session;
        logger.debug("We are going to pay, the context of current session is:" + JSON.stringify(sess));
        if (!sess || !sess.user || !sess.user.openid) {
            logger.error("session is wrong  wrong   wrong wrong........................");
            return resWrap.setError(401);
        }

        var virtueId = req.query.virtue;
        if (!virtueId) {
            return resWrap.setError(400, null, new Error('virtue is not found in query'));
        }
        var openId, subjectName, amount;

        openId = sess.user.openid;

        return virtues.findNewVirtueById(virtueId)
            .then(function (doc) {
                if (!doc) {
                    return Promise.reject(new Error('The virtue[id=' + virtueId + '] is not found'));
                }
                subjectName = doc.subject.name;
                amount = doc.amount;
            })
            .then(function () {
                logger.debug("Start to submit to weixin prepay process: " + JSON.stringify({
                        openid: openId,
                        virtueid: virtueId,
                        subjectName: subjectName,
                        amount: amount
                    }));
                return wx.prepay(openId, virtueId, subjectName, amount);
            })
            .then(function (payData) {
                logger.debug("Weixin prepay is successfule, data to be sent to Weixin H5 to pay actually is:" + JSON.stringify(payData));
                var notifyLink = linkages.getLink('weixinPaymentNotify');
                var homeLink = linkages.getLink('home');
                return resWrap.render('wechat/payment', {
                    openId: openId,
                    virtue: virtueId,
                    payData: payData,
                    links: {
                        notify: notifyLink,
                        home: homeLink
                    }
                });
            })
            .catch(function (err) {
                return resWrap.setError(400, null, err);
            });
    },

    result: function (req, res) {
        //TODO:在每一个页面设定分享内容
        var virtueId = req.query.virtueId;
        if (!virtueId) {
            return res.status(401).end();
        }

        var viewdata = {
            share: {
                title: '日行一善', // 分享标题
                desc: '捐助静音寺建设', // 分享描述
                link: 'http://jingyintemple.top/jingyin/manjusri/index',  // 分享链接
                imgUrl: wxConfig.wrapUrlWithSitHost('/images/sharelogo.jpg'), // 分享图标
            }
        };

        var host = "http://jingyintemple.top";
        var relativeUrl = req.url;
        var url = host + relativeUrl;

        return virtues.findNewVirtueById(virtueId, false)
            .then(function (doc) {
                if (!doc) {
                    return Promise.reject(new Error('The virtue[id=' + virtueId + '] is not found'));
                }
                viewdata.share.title = '静音寺.文殊禅林 - ' + doc.subject.name;
                //if (doc.subject.img) viewdata.share.imgUrl = wxConfig.wrapUrlWithSitHost(doc.subject.img);
                if (doc.subject.type === 'daily') {
                    viewdata.share.desc = '随喜您行持日行一善，成功' + viewdata.share.desc;
                    viewdata.share.link = wxConfig.wrapUrlWithSitHost(linkages.getLink('dailyVirtue'));
                } else if (doc.subject.type === 'suixi') {
                    viewdata.share.desc = '随喜您成功' + viewdata.share.desc;
                    viewdata.share.link = wxConfig.wrapUrlWithSitHost(linkages.getLink('suixi'));
                } else {
                    viewdata.share.desc = '随喜您认捐' + doc.subject.name + ', ' + viewdata.share.desc;
                    viewdata.share.link = wxConfig.wrapUrlWithSitHost(linkages.getLink('jiansi'));
                }
                viewdata.share.amount = doc.amount;
                viewdata.share.subjectname = doc.subject.name;
                return wx.generateShareConfig(url, function (shareConfig) {
                    viewdata.shareConfig = shareConfig;
                    return res.render('wechat/paymentShare', viewdata);
                })
            })
            .catch(function (err) {
                res.status(500).end();
            });
    },
};

