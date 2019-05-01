const logger = require('@finelets/hyper-rest/app/Logger')

function needAuth(req, res) {
    logger.debug('entering needAuth service ....')
    logger.debug('user:' + JSON.stringify(req.user, null, 2) || 'undefined')
    res.json(req.user)
}

module.exports = {
    url: '/jingyin/manjusri/needAuth',
    rests: [{
        type: 'http',
        method: 'get',
        handler: needAuth
    }]
}