const wx = require('../weixin').weixinService,
    logger = require('@finelets/hyper-rest/app/Logger')

function signin(req, res) {
    const rd = require('../wechat/redirects')
    return rd.toLogin(req, res)
}

module.exports = {
    url: '/jingyin/rests/manjusri/to/wx/signin',
    rests: [{
        type: 'http',
        method: 'get',
        handler: signin
    }]
}