var weixin = require('../weixin');
var log4js = require('log4js');
log4js.configure("log4js.conf", {reloadSecs: 300});
var logger = log4js.getLogger();

module.exports = {
    suixi: function (req, res) {
        res.render('wechat/dailyVirtue');
    },

    index: function (req, res) {
        res.render('wechat/accuvirtue');
    },

    //创建日行一善订单
    action: function (req, res) {
        var amount = req.body.amount;
        var trans = {
            transName: '日行一善',
            amount: amount
        };
        var url = weixin.sendPayUrl(trans);
        logger.debug("response the url to payment to client, url = " + url);
        res.end(url);
    }
};