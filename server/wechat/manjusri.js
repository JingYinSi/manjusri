module.exports = {
    home: function (req, res) {
        res.render('wechat/index', {
            title: '首页'
        });
    },

    index: function (req, res) {
        res.render('wechat/manjusri');
    },

    jiansi: function (req, res) {
        res.render('wechat/jiansi', {
            title: '建寺'
        });
    },
};

