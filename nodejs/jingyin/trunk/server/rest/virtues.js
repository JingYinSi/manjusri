/**
 * Created by clx on 2016/10/27.
 */
var virtueModel = require('../wechat/models/virtue'),
    userModel = require('../wechat/models/user'),
    partModel = require('../wechat/models/part'),
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

var virtueListQuery = virtueModel
    .find({state:'payed'})
    .limit(30)
    .sort({timestamp: -1})
    .populate('lord', 'name')
    .populate('subject', 'name')
    .select('timestamp num amount');

Virtues.prototype.list = function (req, res) {
    virtueListQuery.exec(function (err, virtues) {
        res.status(200).json(virtues);
    });
};

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
        giving: obj.giving,
        timestamp: Date.now()
    }
    if (!trans.amount) {
        return setStatus(res, 400, "amount is undefined");
    }
    if (trans.amount <= 0) {
        return setStatus(res, 400, "amount is invalid");
    }

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
        if(trans.num){
            partModel.findById(subject, function (err, part) {
                part.num = part.num - num;
                part.sold = part.sold + num;
                part.save(function (err) {
                    if(!err){
                        return responseVirtue(virtue);
                    }
                });
            });
        } else {
            return responseVirtue(virtue);
        }
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