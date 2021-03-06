var wx = require('../weixin').weixinService,
    wxConfig = require('../weixin').weixinConfig,
    virtues = require('../modules/virtues'),
    Promise = require('bluebird'),
    linkages = require("../rests"),
    responseWrapFactory = require('../../modules/responsewrap'),
    logger = require('@finelets/hyper-rest/app/Logger');

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
        var virtueId = req.query.virtueId;
        if (!virtueId) {
            return res.status(401).end();
        }

        var viewdata = {
            share: {
                title: '日行一善', // 分享标题
                desc: '捐助静音寺建设', // 分享描述
                link: 'http://jingyintemple.top/jingyin/manjusri/index', // 分享链接
                imgUrl: wxConfig.wrapUrlWithSitHost('/images/sharelogo.jpg'), // 分享图标
            },
            menu: linkages.getMainMenuLinkages(),
        };

        /*var host = "http://jingyintemple.top";
        var relativeUrl = req.url;
        var url = host + relativeUrl;*/
        var url = wxConfig.wrapUrlWithSitHost(req.url);

        return virtues.findNewVirtueById(virtueId, false)
            .then(function (doc) {
                if (!doc) {
                    return Promise.reject(new Error('The virtue[id=' + virtueId + '] is not found'));
                }
                var backLink, actionname;
                if (doc.subject.type === 'daily') {
                    backLink = linkages.getLink('dailyVirtue');
                    actionname = doc.subject.name;
                    viewdata.share.title = doc.subject.name;
                    viewdata.share.desc = '随喜捐助五台山静音寺建设，圆满福慧资粮！';
                    viewdata.share.link = wxConfig.wrapUrlWithSitHost(backLink);
                } else if (doc.subject.type === 'suixi') {
                    backLink = linkages.getLink('suixi');
                    actionname = "随喜建寺";
                    viewdata.share.title = '随喜五台山静音寺建设';
                    viewdata.share.desc = '五台山静音寺文殊禅林是以培养僧才为核心，弘扬人间佛教的道场！';
                    viewdata.share.link = wxConfig.wrapUrlWithSitHost(backLink);
                } else {
                    backLink = linkages.getLink('jiansi');
                    actionname = doc.subject.name;
                    viewdata.share.title = '随喜捐助';
                    viewdata.share.desc = '随喜您认捐' + doc.subject.name + ', ' + viewdata.share.desc;
                    viewdata.share.link = wxConfig.wrapUrlWithSitHost(backLink);
                }
                viewdata.amount = doc.amount;
                viewdata.subjectname = actionname;
                viewdata.backlink = backLink;
                return wx.generateShareConfig(url);
            })
            .then(function (shareConfig) {
                viewdata.shareConfig = shareConfig;
                //TODO:更换支付成功页面
                return res.render('manjusri/paymentShare', viewdata);
            })
            .catch(function (err) {
                res.status(500).end();
            });
    },
};