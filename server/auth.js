/**
 * Created by clx on 2017/4/8.
 */
const redirects = require('../server/wechat/redirects');

var log4js = require('log4js');
var logger = log4js.getLogger();
logger.level = 'debug';

module.exports = {
    manjusri : function (req, res, next) {
        var sess = req.session;
        logger.debug("check if the user is already login:" + JSON.stringify(sess));
        if (!sess || !sess.user || !sess.user.openid) {
            logger.debug("Current user does't login, redirect him to login ...........");
            //TODO:某些GET请求可以在登录后自动重定向回来，但另一些请求则不行，请重新综合考虑这个问题
            req.session.redirectToUrl = req.originalUrl;
            return redirects.toLogin(req, res);
        }
        return next();
    }
}