const logger = require('@finelets/hyper-rest/app/Logger')

function signin(req, res) {
    logger.debug('entering WechatSignin service ....')
    let errCode = 403;
    let code = req.query.code
    if (!code) {
        const state = req.query.state
        if(state) {
            logger.error(state)
            errCode = 400
        }
        else logger.warn('Current user refused to signin!')
        return res.status(errCode).end()
    }
    
    return res.redirect(`${process.env.siteBaseUrl}/index.html#${req.query.url}?code=${req.query.code}`)
}

module.exports = {
    url: '/jingyin/rests/manjusri/wx/signin',
    rests: [{
        type: 'http',
        method: 'get',
        handler: signin
    }]
}