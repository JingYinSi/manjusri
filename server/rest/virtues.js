/**
 * Created by clx on 2016/10/27.
 */
var virtueModel = require('../wechat/models/virtue'),
    userModel = require('../wechat/models/user'),
    linkages = require('../rests'),
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

//TODO:显示滚动部分
//TODO:交易成功后需扣减数量

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
        price: obj.price,
        num: obj.num,
        giving: obj.giving
    }
    if (!trans.amount) {
        return setStatus(res, 400, "amount is undefined");
    }
    if (trans.amount <= 0) {
        return setStatus(res, 400, "amount is invalid");
    }

    virtueModel.place(trans, function (err, obj) {
        var selfUrl = linkages.getLink('virtue', {id: obj.id});
        var payUrl = linkages.getLink('pay', {virtue: obj.id});
        payUrl = encodeURIComponent(payUrl);
        payUrl = weixin.weixin.wrapRedirectURLByOath2Way(payUrl);
        var links = {
            self: selfUrl,
            pay: payUrl
        }
        res.links(links);
        res.header('Location', selfUrl);
        res.status(201).json(obj);
    });
};

Virtues.prototype.paid = function (req, res) {
    var data = req.body;
    userModel.findOne({openid: data.openId}, function (err, user) {
        virtueModel.pay(req.params.id, user.id, data.paymentNo, function (err, virtue) {
            var selfUrl = linkages.getLink('virtue', {id: virtue.id});
            var links = {
                self: selfUrl,
            }
            res.links(links);
            res.status(200).json(virtue);
        });
    });
};

module.exports = new Virtues();