/**
 * Created by clx on 2016/11/29.
 */
var config, urlToGetAccessToken;

function WeixinConfig() {
}

WeixinConfig.prototype.getUrlToGetAccessToken = function(){
    return urlToGetAccessToken;
}

WeixinConfig.prototype.getUrlToGetOpenId = function (code) {
    var url = config.apiBaseURL + "access_token?appid="
        + config.appId + "&secret=" + config.appSecret
        + "&code=" + code + "&grant_type=authorization_code";
    return url;
}

module.exports = function (configData) {
    config = configData;
    urlToGetAccessToken = 'https://api.weixin.qq.com/cgi-bin/token?' +
        'grant_type=client_credential&appid=' + config.appId + '&secret=' + config.appSecret;
    return new WeixinConfig();
}