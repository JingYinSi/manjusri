var Part = require('./models/part'),
    Virtue = require('./models/virtue'),
    virtuesModule = require('../modules/virtues'),
    createResponseWrap = require('../../modules/responsewrap');

function listVirtuesAndTotalTimes(callback) {
    var data = {};
    virtuesModule.listLastVirtues(30)
        .then(function (list) {
            data.virtues = list;
            return Virtue.count({state: 'payed'});
        })
        .then(function (times) {
            data.times = times;
            return callback(null, data);
        })
        .catch(function (err) {
            return callback(err);
        });
}

module.exports = {
    home: function (req, res) {
        var res = createResponseWrap(res);
        listVirtuesAndTotalTimes(function (err, data) {
            if (err) return res.setError(500, null, err);
            data.title = '首页';
            res.render('wechat/index', data);
        });
    },

    jiansi: function (req, res) {
        var data = {
            title: '建寺',
            parts: []
        };
        Part.find({type: 'part', onSale: true}, function (err, parts) {
            if (!err) {
                data.parts = parts;
                res.render('wechat/jiansi', data);
            }
        });
    },

    dailyVirtue: function (req, res) {
        listVirtuesAndTotalTimes(function (err, data) {
            Part.findOne({type: 'daily', onSale: true}, function (err, part) {
                if (!err) {
                    data.part = part;
                    data.title = '建寺-日行一善';
                    res.render('wechat/dailyVirtue', data);
                }
            });
        });
    },

    suixi: function (req, res) {
        var data = {
            title: '建寺-随喜所有建庙功德'
        };
        Part.findOne({type: 'suixi', onSale: true}, function (err, part) {
            if (!err) {
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
    }
};

