var Part = require('./models/part');

module.exports = {
    home: function (req, res) {
        res.render('wechat/index', {
            title: '首页'
        });
    },

    jiansi: function (req, res) {
        var data = {
            title: '建寺',
            parts: []
        };
        Part.find({type: 'part', onSale: true}, function (err, parts) {
            if(!err){
                data.parts = parts;
                res.render('wechat/jiansi', data);
            }
        });
    },

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

    suixi: function (req, res) {
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
    },
};

