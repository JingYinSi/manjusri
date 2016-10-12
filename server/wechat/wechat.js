var sha1 = require('sha1'),
    parseStringToJs = require('xml2js').parseString;

var log4js = require('log4js');
log4js.configure("log4js.conf", {reloadSecs: 300});
var logger = log4js.getLogger();

module.exports = {
    hook: function (req, res) {
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
            logger.info("openid:" + openid);
            logger.info("body:" + body);
            parseStringToJs(body, function (err, result) {
                if(err){
                    logger.error(err);
                    return;
                }

                var data = result.xml;
                logger.error(data);
                for (var p in data) {
                    data[p] = data[p][0];
                }
                res.write("MsgType:" + data.MsgType);
                res.write("request body:" + JSON.stringify(data));
                res.end();
            });
        });
    }
};