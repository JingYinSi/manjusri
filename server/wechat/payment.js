var wx = require('../weixin').weixinService,
    virtues = require('../modules/virtues'),
    users = require('../modules/users'),
    Promise = require('bluebird'),
    responseWrapFactory = require('../../modules/responsewrap');

var log4js = require('log4js');
log4js.configure("log4js.conf", {reloadSecs: 300});
var logger = log4js.getLogger();

module.exports = {
    pay: function (req, res) {
        var resWrap = responseWrapFactory(res);
        var code = req.query.code;
        if (!code) {
            return resWrap.setError(400, null, new Error('code is not found in query'));
        }
        var virtueId = req.query.virtue;
        if (!virtueId) {
            return resWrap.setError(400, null, new Error('virtue is not found in query'));
        }
        var openId, subjectName, amount;
        var tasks = [
            wx.getOpenId(code)
                .then(function (data) {
                    openId = data.openid;
                    logger.debug('...........................................................................');
                    logger.debug('we are going to call register user:\n' + JSON.stringify(data));
                    logger.debug('...........................................................................');
                    return users.register(data.access_token, openId);
                }),
            virtues.findNewVirtueById(virtueId)
                .then(function (doc) {
                    if(!doc)
                        return Promise.reject(new Error('The virtue[id=' + virtueId + '] is not found'));
                    subjectName = doc.subject.name;
                    amount = doc.amount;
                })];
        return Promise.all(tasks)
            .then(function () {
                return wx.prepay(openId, virtueId, subjectName, amount);
            })
            .then(function (payData) {
                logger.debug("Pay data to be sent to H5:" + JSON.stringify(payData));
                resWrap.render('wechat/payment', {
                    openId: openId,
                    virtue: virtueId,
                    payData: payData
                });
            })
            .catch(function (err) {
                return resWrap.setError(400, null, err);
            });
    },

    result: function (req, res) {
        res.render('wechat/paymentResult');
    },
};

