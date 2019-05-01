const jwt = require('jsonwebtoken'),
    wx = require('../weixin').weixinService,
    logger = require('@finelets/hyper-rest/app/Logger')

function signin(req, res) {
    logger.debug('entering WechatSignin service ....')
    let errCode = 403;
    let code = req.query.code
    if (!code) {
        const state = req.query.state
        if (state) {
            logger.error(state)
            errCode = 400
        } else logger.warn('Current user refused to signin!')
        return res.status(errCode).end()
    }

    return wx.getOpenId(code)
        .then(function (data) {
            const token = jwt.sign(data, process.env.JWT_SECRET)
            return res.redirect(`${process.env.siteBaseUrl}/index.html#${req.query.url}?token=${token}`)
        })
        .catch(function (err) {
            logger.error('Fail from wx getopenid: \r\n' + err)
            res.status(500).end()
        });
}

module.exports = {
    url: '/jingyin/rests/manjusri/wx/signin',
    rests: [{
        type: 'http',
        method: 'get',
        handler: signin
    }]
}