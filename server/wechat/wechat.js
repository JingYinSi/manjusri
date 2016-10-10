var sha1 = require('sha1');

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
    }
};