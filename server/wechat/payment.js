var wx = require('../weixin').weixinService,
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
                        virtueid:virtueId,
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
                    links:{
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
        var host = "http://jingyintemple.top";
        var relativeUrl = req.url;
        var url = host + relativeUrl;
        return wx.generateShareConfig(url,function (shareConfig) {
            return res.render('wechat/paymentShare',shareConfig);
        });
    },
};

