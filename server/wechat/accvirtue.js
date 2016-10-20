var VirtueModel = require('./models/virtue'),
    weixin = require('../weixin');

module.exports = {
    index: function (req, res) {
        res.render('wechat/accuvirtue');
    },
    //创建日行一善订单
    action: function (req, res) {
        var amount = req.body.amount;
        VirtueModel.placeVirtue(amount, function (err, virtue) {
            var trans = {
                transId: virtue._id,
                transName: '日行一善',
                amount: amount
            };
            weixin.sendPayUrl(res, trans);
        });
    }
};