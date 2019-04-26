/**
 * Created by clx on 2017/4/8.
 */
const redirects = require('../server/wechat/redirects'),
    SessionUser = require('./modules/2.1/SessionUser'),
    logger = require('@finelets/hyper-rest/app/Logger');

module.exports = function (req, res, next) {
    let openid = 'o0ghywcfW_2Dp4oN-7NADengZAVM';
    if (!process.env.DEVELOPMENT) {
        logger.debug('now we are going to check session user ........');
        var sess = req.session;
        if (!sess || !sess.user || !sess.user.openid) {
            logger.debug("Current user does't login, redirect him to login ...........");
            //TODO:某些GET请求可以在登录后自动重定向回来，但另一些请求则不行，请重新综合考虑这个问题
            sess.redirectToUrl = req.originalUrl;
            return redirects.toLogin(req, res);
        }
        openid = sess.user.openid;
    }
    return SessionUser(openid)
        .then(function (user) {
            req.user = user;
            return next();
        })
        .catch(function (reason) {
            return reason.sendStatusTo(res);
        })
}