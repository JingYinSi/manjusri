/**
 * Created by sony on 2016/10/12.
 */
var simpleget = require('simple-get');

module.exports.getOpenId = function(code, callback){
        simpleget.concat('https://c9.io/skyclx118', function(err, res, data){
            callback(data.toString());
        });
    }

/*module.exports = function(config) {
    this.getOpenId = function(code, callback){
        console.log(simpleget.concat.toString());
        simpleget.concat('https://c9.io/skyclx118', function(err, res, data){
            callback(data.toString());
        });
    }
    return this;
}*/

/*{
 getOpenId: function (code, callback) {
 var url = this.apiBaseURL + "access_token?appid=" + this.appid + "&secret=" + this.appsecret + "&code=" + code + "&grant_type=authorization_code";
 https.get(url, function (res) {
 /!*var str = '', resp;
 res.on('data', function (data) {
 str += data;
 });
 res.on('end', function () {
 console.log("获得用户openid:" + str);
 try {
 resp = JSON.parse(str);
 successFn(resp.openid);
 } catch (e) {
 //return errorRender(res, '解析远程JSON数据错误', str);
 }
 });*!/
 });
 }
 }*/
