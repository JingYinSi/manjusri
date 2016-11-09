var weixin = require('../weixin'),
    Part = require('./models/part');


var log4js = require('log4js');
log4js.configure("log4js.conf", {reloadSecs: 300});
var logger = log4js.getLogger();

module.exports = {
    index: function (req, res) {
        res.render('wechat/suixi', {
            title: '建寺-随喜所有建庙功德'
        });
    },

    trans: function (req, res) {
        var id = req.params.partId;
        Part.findById(id, function (err, part) {

            res.render('wechat/trans', {
                title: '建寺-' + part.name,
                part: part
            });
        });
    },

    /*trans: function (req, res) {
        var productId = req.params.productId;
        var productNames = ['万尊文殊菩萨像小', '万尊文殊菩萨像中', '五方文殊菩萨像'];
        var product = {
            id: productId,
            name:productNames[productId - 1],
            sold:1900,
            left:5600,
            price:1980.00
        };
        res.render('wechat/trans', {
            title: '建寺-' + product.name,
            product: product
        });
    },*/

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