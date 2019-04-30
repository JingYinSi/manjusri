const wx = require('../weixin').weixinService,
    logger = require('@finelets/hyper-rest/app/Logger')

function testsess(req, res) {
    // 检查 session 中的 isVisit 字段
    // 如果存在则增加一次，否则为 session 设置 isVisit 字段，并初始化为 1。
    if (req.session.user) {
        req.session.user.isVisit++;
        res.send('<p>第 ' + req.session.user.isVisit + '次来此页面</p>');
    } else {
        req.session.user = {isVisit: 1}
        res.send("欢迎第一次来这里");
        console.log(req.session);
    }
}

module.exports = {
    url: '/jingyin/rests/manjusri/testsess',
    rests: [{
        type: 'http',
        method: 'get',
        handler: testsess
    }]
}