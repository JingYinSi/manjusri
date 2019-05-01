const jwt = require('jsonwebtoken'),
    wx = require('../weixin').weixinService,
    logger = require('@finelets/hyper-rest/app/Logger')

function auth(req, res) {
    logger.debug('entering Wechat Authentication service ....')
    let code = req.query.code
    if (!code) {
        logger.error('query param code is not contained in request')
        return res.status(400).end()
    }

    return wx.getOpenId(code)
        .then(function (data) {
                logger.debug('wx auth info:' + JSON.stringify(data, null, 2) || 'undefined')
                    const token = jwt.sign(data, process.env.JWT_SECRET)
                    return res.json({token}).end()
                })
            .catch(function (err) {
                logger.error('Fail from wx getopenid: \r\n' + err)
                res.status(500).end()
            });
        }

    module.exports = {
        url: '/jingyin/rests/manjusri/wx/auth',
        rests: [{
            type: 'http',
            method: 'get',
            handler: auth
        }]
    }