var weixin = require('../weixin');

module.exports = {
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
        res.end(url);
    }
};