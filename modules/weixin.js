/**
 * Created by sony on 2016/10/12.
 */
var simpleget = require('simple-get');

module.exports = function(config){
    this.apiBaseURL = config.apiBaseURL;
    this.appid = config.appId;
    this.appsecret = config.appSecret;
    this.oauth2BaseURL = config.oauth2BaseURL;

    this.getOpenId = function(code, callback){
        var url = this.apiBaseURL + "access_token?appid="
            + this.appid + "&secret=" + this.appsecret
            + "&code=" + code + "&grant_type=authorization_code";

        simpleget.concat(url, function(err, res, data){
            callback(data.openid);
        });
    }
    this.wrapRedirectURLByOath2Way = function(url){
        var wrapedUrl = this.oauth2BaseURL + "?appid=" + this.appid
            + "&redirect_uri=" + url + "&response_type=code&scope=snsapi_base#wechat_redirect";
        return wrapedUrl;
    }
    return this;
}
