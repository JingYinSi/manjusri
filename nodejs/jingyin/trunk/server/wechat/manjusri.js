module.exports = {
    home: function (req, res) {
        res.render('wechat/index', {
            title: '首页a'
        });
    },

    index: function (req, res) {
        res.render('wechat/manjusri');
    },

    jiansi: function (req, res) {
        res.render('wechat/jiansi');
    },
};

