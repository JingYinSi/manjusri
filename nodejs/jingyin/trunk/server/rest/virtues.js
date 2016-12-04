/**
 * Created by clx on 2016/10/27.
 */
var virtues = require('../modules/virtues'),
    parts = require('../modules/parts'),
    userModel = require('../wechat/models/user'),
    virtueModel = require('../wechat/models/virtue'),
    //partModel = require('../wechat/models/part'),
    linkages = require('../rests'),
    //usersModule = require('../modules/users'),
    createResponseWrap = require('../../modules/responsewrap'),
    weixin = require('../weixin'),
    weixinConfig = weixin.weixinConfig,
    weixinService = weixin.weixinService;

var log4js = require('log4js');
log4js.configure("log4js.conf", {reloadSecs: 300});
var logger = log4js.getLogger();

function Virtues() {
}

Virtues.prototype.prepay = function (req, res) {
    var obj = req.body;
    var resWrap = createResponseWrap(res);

    function responseVirtue(virtue) {
        var selfUrl = linkages.getLink('virtue', {id: virtue.id});
        var payUrl = linkages.getLink('pay', {virtue: virtue.id});
        payUrl = encodeURIComponent(payUrl);
        payUrl = weixinConfig.wrapRedirectURLByOath2Way(payUrl);
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
            if (!details || !details.num) {
                return responseVirtue(virtue);
            }
            return parts.updatePartNum(obj.subject, obj.num * 1)
                .then(function () {
                    return responseVirtue(virtue);
                });
        })
        .catch(function (err) {
            logger.error('微信预支付出错:' + err.toString());
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
        return resWrap.setError(400);
    }
    var openId = notify.openId;
    var virtueId = notify.virtueId;
    var paymentNo = notify.paymentNo;

    var lord;

    return userModel.findOne({openid: openId})
        .then(function (user) {
            if (user) {
                return Promise.resolve(user);
            }
            logger.info('Can not found user with openid:' + notify.openid
                + ', we are going to find it on weixin again');
            return weixinService.getUserInfoByOpenId(openId)
                .then(function (userInfo) {
                    var data = {
                        name: userInfo.nickname,
                        openid: userInfo.openid,
                        img: userInfo.headimgurl,
                        city: userInfo.city,
                        province: userInfo.province,
                        sex: userInfo.sex,
                        subscribe: userInfo.subscribe_time
                    }
                    var user = new userModel(data);
                    return user.save();
                });
        })
        .then(function (user) {
            lord = user;
            return virtueModel.findById(virtueId);
        })
        .then(function (virtue) {
            virtue.lord = lord.id;
            virtue.paymentNo = paymentNo;
            virtue.state = 'payed';
            return virtue.save();
        })
        .then(function () {
            return res.end(notify.replyOK());
        })
        .catch(function (err) {
            return resWrap.setError(500, null, err);
        });
}

//TODO: 调整菜单
//TODO: restful已支付服务是否有必要保留？
//TODO: 如果保留，那么这里的代码与../wechat/payment.js的paidNotify存在重复
/*Virtues.prototype.paid = function (req, res) {
 var data = req.body;

 function doPay(user) {
 virtueModel.pay(req.params.id, user.id, data.paymentNo, function (err, virtue) {
 var selfUrl = linkages.getLink('virtue', {id: virtue.id});
 var links = {
 self: selfUrl,
 }
 res.links(links);
 res.status(200).json(virtue);
 });
 }

 userModel.findOne({openid: data.openId}, function (err, user) {
 if (!user) {
 logger.info('Can not found user with openid:' + data.openId);
 usersModule.register(data.openId, function (err, userAdded) {
 if (err) {
 logger.error('register user failed:' + err);
 return;
 }
 doPay(userAdded);
 });
 return;
 }
 doPay(user);
 });

 };*/

module.exports = new Virtues();