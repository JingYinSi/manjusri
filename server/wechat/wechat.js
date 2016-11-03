var Users = require('../modules/users'),
    welcome = require('../modules/welcome'),
    //XML = require('pixl-xml'),
    //wechat = require('wechat'),
    weixin = require('../weixin').weixin;

var log4js = require('log4js');
log4js.configure("log4js.conf", {reloadSecs: 300});
var logger = log4js.getLogger();

var msgHandlers = {
    subscribe: Users.register
};

module.exports = {
    dealWithMessage: function (req, res, next) {
        var msg = req.weixin;
        logger.debug('Message from weixin:\n' + JSON.stringify(msg));
        if (msg.MsgType === 'event') {
            var handler = msgHandlers[msg.Event];
            if (handler) {
                handler(msg.ToUserName, function (err, user) {
                    welcome(user, function (err, answer) {
                        res.reply(answer);
                    })
                })
            }
        }
        res.reply('');
    }

    /*receive: function (req, res) {
     logger.debug('receive a post request from wechat ....')
     // 微信加密签名
     var signature = req.query.signature,
     // 时间戳
     timestamp = req.query.timestamp,
     // 随机数
     nonce = req.query.nonce,
     openid = req.query.openid;

     var body = "";
     req.on("data", function (chunk) {
     body += chunk;
     });
     req.on("end", function () {
     var doc = XML.parse(body);
     /!*if(doc.MsgType !== 'event' || doc.Event !== 'subscribe'){
     logger.debug('a ' + doc.MsgType + ' message, ignore now ....');
     res.end('');
     return;
     }*!/

     var msg = {
     signature : signature,
     timestamp: timestamp,
     nonce : nonce,
     openid : openid,
     msg: doc
     }
     logger.debug('receive a message from weixin:\n' + JSON.stringify(msg));
     weixin.dealWithMessage(msg, function (err, answer) {
     var content = answer || doc.FromUserName + 'Hello';
     var xml = '<xml><TOUserName><![CDATA[' + doc.FromUserName + ']</TOUserName>'
     + '<FromUserName><![CDATA[jyswscl]</FromUserName>'
     + '<CreateTime><![CDATA[' + doc.CreateTime + ']</CreateTime>'
     + '<MsgType><![CDATA[text]</MsgType>'
     + '<Content><![CDATA[' + content + ']</Content>';
     logger.debug(xml);



     res.writeHead(200, {
     'Content-Type': 'text/xml',
     //'Content-Length': xml.length,
     });
     res.write(xml);
     res.end();
     })
     });
     }*/
};
