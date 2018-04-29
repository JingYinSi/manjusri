/**
 * Created by clx on 2016/10/27.
 */
var virtues = require('../modules/virtues'),
    parts = require('../modules/parts'),
    userModel = require('../wechat/models/user'),
    virtueModel = require('../wechat/models/virtue'),
    linkages = require('../rests'),
    createResponseWrap = require('../../modules/responsewrap'),
    weixin = require('../weixin'),
    weixinConfig = weixin.weixinConfig,
    weixinService = weixin.weixinService;

var log4js = require('log4js');
var logger = log4js.getLogger();
logger.level = 'debug';

function Virtues() {
}

Virtues.prototype.prepay = function (req, res) {
    var obj = req.body;
    logger.debug("the prepay data in request body is:" + JSON.stringify(obj));
    if (!req.session || !req.session.user)
        logger.error("We are prepaying, but the user does't login, How come ？？？？？");
    logger.debug("entering prepay: " + JSON.stringify(obj));
    var resWrap = createResponseWrap(res);

    function responseVirtue(virtue) {
        var selfUrl = linkages.getLink('virtue', {id: virtue.id});
        var payUrl = linkages.getLink('pay', {virtue: virtue.id});
        logger.debug("The pay url from resources registry is: " + payUrl);

        var links = {
            self: selfUrl,
            pay: payUrl
        }
        res.links(links);
        res.header('Location', selfUrl);
        res.status(201).json(virtue);
    }

    var details = null;
    if (obj.num) details = {price: obj.price, num: obj.num};
    return virtues.place(obj.subject, obj.amount, details, obj.giving)
        .then(function (virtue) {
            logger.debug("We place a virtue to database: " + JSON.stringify(obj));
            if (!details || !details.num) {
                return responseVirtue(virtue);
            }
            return parts.updatePartNum(obj.subject, obj.num * 1)
                .then(function () {
                    return responseVirtue(virtue);
                });
        })
        .catch(function (err) {
            logger.error('微信预支付出错:' + JSON.stringify(err));
            if (err.name === 'ValidationError') {
                return resWrap.setError(400, null, err);
            }
            return resWrap.setError(500, null, err);
        });
};

Virtues.prototype.paidNotify = function (req, res) {
    var notify = weixinConfig.parsePaymentNotification(req.body.xml);
    var resWrap = createResponseWrap(res);
    logger.debug('Paid notify from weixin:\n', JSON.stringify(notify));
    if (!notify.pass) {
        logger.error("We received a paid notification from weixin, " +
            "but it shows that notify.pass is false, please check it!!!!");
        return resWrap.setError(400);
    }
    var openId = notify.openId;
    var virtueId = notify.virtueId;
    var paymentNo = notify.paymentNo;

    var lord;

    return userModel.findOne({openid: openId})
        .then(function (user) {
            if (!user) {
                var errmsg = "We received a paid notification from weixin, but we Can't find the user with openid:"
                    + notify.openid + '？ please check it ！！！！';
                logger.error(errmsg);
                return Promise.reject(new Error(errmsg));
            }
            logger.debug("We find the lord of the virtue from weixin paid notification.");
            lord = user;
            return virtueModel.findById(virtueId);
        })
        .then(function (virtue) {
            if(!virtue){
                var errmsg = "We received a paid notification from weixin, but we Can't find such virtue？ please check it ！！！！";
                logger.error(errmsg);
                return Promise.reject(new Error(errmsg));
            }
            virtue.lord = lord.id;
            virtue.paymentNo = paymentNo;
            virtue.state = 'payed';
            logger.debug("We are going to update the virtue by weixin paid notification: " + JSON.stringify(virtue));
            return virtue.save();
        })
        .then(function () {
            logger.info("Virtue update successfully !!!!!");
            return res.end(notify.replyOK());
        })
        .catch(function (err) {
            return resWrap.setError(500, null, err);
        });
}

module.exports = new Virtues();