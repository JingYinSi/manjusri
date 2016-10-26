module.exports = {
    home: function (req, res) {
        res.render('wechat/index');
    },
    index: function (req, res) {
        res.render('wechat/manjusri');
    },
    jiansi: function (req, res) {
    res.render('wechat/jiansi');
}
};