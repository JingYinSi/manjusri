var /*weixin = require('../weixin'),*/
    Part = require('./models/part');
var log4js = require('log4js');
log4js.configure("log4js.conf", {reloadSecs: 300});
var logger = log4js.getLogger();

module.exports = {
    /*dailyVirtue: function (req, res) {
        var data = {
            title: '建寺-日行一善',
        };
        Part.findOne({type: 'daily', onSale: true}, function (err, part) {
            if(!err){
                data.part = part;
                res.render('wechat/dailyVirtue', data);
            }
        });
    },*/
};