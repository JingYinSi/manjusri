var Users = require('../modules/users'),
    welcome = require('../modules/welcome');

var log4js = require('log4js');
log4js.configure("log4js.conf", {reloadSecs: 300});
var logger = log4js.getLogger();

var msgHandlers = {
    subscribe: Users.register
};

module.exports = function (req, res, next) {
    var msg = req.weixin;
    logger.debug('Message from weixin:\n' + JSON.stringify(msg));
    if (msg.MsgType === 'event') {
        var handler = msgHandlers[msg.Event];
        if (!handler) return res.reply('');
        return handler(msg.FromUserName)
            .then(function (user) {
                return welcome(user);
            })
            .then(function (answer) {
                logger.debug('welcome information should be shown:' + JSON.stringify(answer));
                return res.reply(answer);
            })
            .catch(function (err) {
                logger.error('Fail to register user:' + err.message);
                return res.reply('');
            });
    }
}
