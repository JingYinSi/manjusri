/**
 * Created by clx on 2016/10/27.
 */
var virtueModel = require('../wechat/models/virtue'),
    userModel = require('../wechat/models/user'),
    partModel = require('../wechat/models/part'),
    linkages = require('../rests'),
    usersModule = require('../modules/users'),
    weixin = require('../weixin');
var log4js = require('log4js');
log4js.configure("log4js.conf", {reloadSecs: 300});
var logger = log4js.getLogger();

function setStatus(response, code, errMsg) {
    response.status(code);
    if (errMsg) response.send(errMsg);
    response.end();
}

function Virtues() {
}

Virtues.prototype.prepay = function (req, res) {
    var obj = req.body;
    var subject = obj.subject;
    if (!subject) {
        setStatus(res, 400, "subject is not defined");
        return;
    }

    var trans = {
        subject: subject,
        amount: Math.round(obj.amount * 100) / 100,
        //timestamp: Date.now()
    }
    if (!trans.amount) {
        return setStatus(res, 400, "amount is undefined");
    }
    if (trans.amount <= 0) {
        return setStatus(res, 400, "amount is invalid");
    }

    if(obj.price) trans.price = obj.price;
    if(obj.num) trans.num = obj.num;
    if(obj.giving) trans.giving = obj.giving;

    function responseVirtue(virtue) {
        var selfUrl = linkages.getLink('virtue', {id: virtue.id});
        var payUrl = linkages.getLink('pay', {virtue: virtue.id});
        payUrl = encodeURIComponent(payUrl);
        payUrl = weixin.weixin.wrapRedirectURLByOath2Way(payUrl);
        var links = {
            self: selfUrl,
            pay: payUrl
        }
        res.links(links);
        res.header('Location', selfUrl);
        res.status(201).json(virtue);
    }

    virtueModel.place(trans, function (err, virtue) {
        if (err) {
            logger.error('Place virtue failed:\n' + err);
            return setStatus(res, 500, err);
        }
        if (trans.num) {
            partModel.findById(subject, function (err, part) {
                part.num = part.num - trans.num * 1;
                part.sold = part.sold + trans.num * 1;
                part.save(function (err) {
                    if (!err) {
                        return responseVirtue(virtue);
                    }
                });
            });
        } else {
            return responseVirtue(virtue);
        }
    });
};

//TODO: 调整菜单
//TODO: restful已支付服务是否有必要保留？
//TODO: 如果保留，那么这里的代码与../wechat/payment.js的paidNotify存在重复
Virtues.prototype.paid = function (req, res) {
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

};

module.exports = new Virtues();