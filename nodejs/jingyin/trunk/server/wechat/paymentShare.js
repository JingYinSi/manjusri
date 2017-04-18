/*
var wx = require('../weixin').weixinService,
    Promise = require('bluebird');

var log4js = require('log4js');
log4js.configure("log4js.conf", {reloadSecs: 300});
var logger = log4js.getLogger();

module.exports = {
    result: function (req, res) {
        var host = "http://jingyintemple.top";
        var relativeUrl = req.url;
        var url = host + relativeUrl;
        wx.generateShareConfig(url,function (shareConfig) {
            res.render('wechat/paymentShare',shareConfig);
        });
    },
};*/
