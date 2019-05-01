/**
 * Created by clx on 2017/4/8.
 */
const jwt = require('jsonwebtoken'),
    logger = require('@finelets/hyper-rest/app/Logger');

module.exports = function (req, res, next) {
    logger.debug('enter auth .....')
    let code = 401
    if (req.headers.authorization) {
        try {
            let authStrs = req.headers.authorization.split(' ')
            if (authStrs.length == 2 && authStrs[0] === 'Bearer' && authStrs[1]) {
                code = 403
                const decoded = jwt.verify(authStrs[1], process.env.JWT_SECRET)
                logger.debug('Decoded auth: ' + JSON.stringify(decoded, null, 2) || 'undefined')
                let {access_token} = decoded
                if (access_token) next()
            }
        } catch (err) {}
    }

    logger.error('Fail to authorization from head')
    return res.status(code).end()
}