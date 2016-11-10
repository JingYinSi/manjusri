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
};

