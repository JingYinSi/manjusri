var wx = require('../weixin').weixinService,
    Promise = require('bluebird');

var log4js = require('log4js');
log4js.configure("log4js.conf", {reloadSecs: 300});
var logger = log4js.getLogger();

module.exports = {
    result: function (req, res) {
        var url = "";//todo:待分享的地址
        wx.generateShareConfig(url).then(function (shareConfig) {
            res.render('wechat/paymentShare',shareConfig);
        });
    },
};