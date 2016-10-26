var weixin = require('../weixin');


var log4js = require('log4js');
log4js.configure("log4js.conf", {reloadSecs: 300});
var logger = log4js.getLogger();

module.exports = {
    dailyVirtue: function (req, res) {
        res.render('wechat/dailyVirtue');
    },

    index: function (req, res) {
        res.render('wechat/accuvirtue');
    },

    //创建日行一善订单
    action: function (req, res) {
        function responseError(code, reason) {
            res.status(code);
            res.statusMessage = reason;
            res.end();
        }

        var trans = {
            transName: '日行一善',
            amount: Math.round(req.body.amount * 100),
        }
        if (!trans.amount) {
            responseError(400, "amount is undefined");
            return;
        }
        if (trans.amount <= 0) {
            responseError(400, "amount is invalid");
            return;
        }
        var target = req.body.target;
        if(target) trans.target = target;

        var url = weixin.sendPayUrl(trans);
        logger.debug("response the url to payment to client, url = " + url);
        res.end(url);
    },
};