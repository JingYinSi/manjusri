/**
 * Created by clx on 2016/11/3.
 */
var simpleget = require('simple-get');

module.exports = {
    simpleGetJson: function (url, callback) {
        simpleget.concat(url, function (err, res, buf) {
            //TODO:检查是否出错
            var obj = JSON.parse(buf.toString()); //TODO:这里少一个分号为何测试不能发现错误？
            callback(null, obj);
        });
    }
}