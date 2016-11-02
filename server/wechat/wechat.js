var sha1 = require('sha1'),
    XML = require('pixl-xml'),
    wechat = require('wechat'),
    weixin = require('../weixin').weixin;

var log4js = require('log4js');
log4js.configure("log4js.conf", {reloadSecs: 300});
var logger = log4js.getLogger();

module.exports = {
    hook: function (req, res) {
        logger.debug('receive a hook message from wechat ....')
        var token = "jingyinManjusri";
        // 微信加密签名
        var signature = req.query.signature,
            // 时间戳
            timestamp = req.query.timestamp,
            // 随机数
            nonce = req.query.nonce,
            // 随机字符串
            echostr = req.query.echostr;

        var keys = [];
        keys.push(token);
        keys.push(timestamp);
        keys.push(nonce);
        keys = keys.sort();
        var str = keys[0] + keys[1] + keys[2];
        var sha1val = sha1(str).toUpperCase();

        var rtn = 'something wrong!!!';
        if (signature && signature.toUpperCase() === sha1val) {
            rtn = echostr;
        }
        res.end(rtn);
    },
    receive: function (req, res) {
        var doc = req.weixin;
        res.reply('hehehehe你好');
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
