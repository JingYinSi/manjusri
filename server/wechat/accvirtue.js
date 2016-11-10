var weixin = require('../weixin');
var log4js = require('log4js');
log4js.configure("log4js.conf", {reloadSecs: 300});
var logger = log4js.getLogger();

module.exports = {
    dailyVirtue: function (req, res) {
        var data = {
            title: '建寺-日行一善',
        };
        Part.findOne({type: 'daily', onSale: true}, function (err, part) {
            if(!err){
                data.part = part;
                res.render('wechat/dailyVirtue', data);
            }
        });
    },

    //创建日行一善订单
    action: function (req, res) {
        function responseError(code, reason) {
            res.status(code);
            res.statusMessage = reason;
            res.end();
        }

        var subject = req.body.subject;
        if (!subject) {
            responseError(400, "subject is not defined");
            return;
        }

        var trans = {
            subject: subject,
            amount: Math.round(req.body.amount * 100) / 100,
        }
        if (!trans.amount) {
            responseError(400, "amount is undefined");
            return;
        }
        if (trans.amount <= 0) {
            responseError(400, "amount is invalid");
            return;
        }

        var name = req.body.name;
        if (name) trans.name = name;

        var price = req.body.price;
        if (price) trans.price = price;

        var num = req.body.num;
        if (num) trans.num = num;

        var giving = req.body.giving;
        if (giving) trans.giving = giving;

        var url = weixin.sendPayUrl(trans);
        res.end(url);
    },
};