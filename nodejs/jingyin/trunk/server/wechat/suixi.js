var Part = require('./models/part');
var log4js = require('log4js');
log4js.configure("log4js.conf", {reloadSecs: 300});
var logger = log4js.getLogger();

module.exports = {
    /*index: function (req, res) {
        var data = {
            title: '建寺-随喜所有建庙功德',
        };
        Part.findOne({type: 'suixi', onSale: true}, function (err, part) {
            if(!err){
                data.part = part;
                res.render('wechat/suixi', data);
            }
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
    },*/
};