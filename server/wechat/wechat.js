var Users = require('../modules/users'),
    welcome = require('../modules/welcome');

var log4js = require('log4js');
log4js.configure("log4js.conf", {reloadSecs: 300});
var logger = log4js.getLogger();

var msgHandlers = {
    subscribe: Users.registerWeixinUser
};

module.exports = function (req, res, next) {
    var msg = req.weixin;
    logger.debug('Message from weixin:\n' + JSON.stringify(msg));
    if (msg.MsgType === 'event') {
        var handler = msgHandlers[msg.Event];
        if (!handler) return res.reply('');
        return handler(msg.FromUserName)
            .then(function (user) {
                welcome(user);
            })
            .then(function (answer) {
                return res.reply(answer);
            })
            .catch(function (err) {
                logger.error('Fail to register user:' + err.message);
                return res.reply('');
            });
    }
}

module.exports = {
    dealWithMessage: function (req, res, next) {
        var msg = req.weixin;
        logger.debug('Message from weixin:\n' + JSON.stringify(msg));
        if (msg.MsgType === 'event') {
            var handler = msgHandlers[msg.Event];
            if (handler) {
                handler(msg.FromUserName, function (err, user) {
                    welcome(user, function (err, answer) {
                        res.reply(answer);
                    });
                });
            } else {
                res.reply('');
            }
        }
    }
};
