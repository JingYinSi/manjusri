/**
 * Created by sony on 2016/10/13.
 */
var weixinModule = require('../modules/weixin'),
    payurl = require('./payurl').payUrl,
    querystring = require('querystring');
const log4js = require('log4js');
log4js.configure("log4js.conf", {reloadSecs: 300});
const logger = log4js.getLogger();

module.exports = {
    weixin: weixinModule({
        appId: "wx76c06da9928cd6c3",
        appSecret: "f4d498d87cf8641b83671a533c3999ec",
        mchId: "1364986702",
        mchKey: "womendoushiwutaishanjingyinsidet",
        apiBaseURL: "https://api.weixin.qq.com/sns/oauth2/",
        oauth2BaseURL: "https://open.weixin.qq.com/connect/oauth2/authorize"
    }),

    sendPayUrl: function (payInfo) {
        var url = payurl + '?';
        var index = 0;
        //TODO: 以下这段代码可以优化
        for (var k in payInfo) {
            url += (index > 0) ? '&' + k + '=' + payInfo[k] : k + '=' + payInfo[k];
            index++;
        }
        url = encodeURIComponent(url);
        url = this.weixin.wrapRedirectURLByOath2Way(url);
        return url;
    }
}


