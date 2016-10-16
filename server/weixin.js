/**
 * Created by sony on 2016/10/13.
 */
const weixinModule = require('../modules/weixin'),
    payurl = require('./payurl').payUrl;

module.exports = {
    weixin: weixinModule({
        appId: "wxc93a54d2d6e5b682",
        appSecret: "f4d498d87cf8641b83671a533c3999ec",
        //appId: "wx76c06da9928cd6c3",
        //appSecret: "f4d498d87cf8641b83671a533c3999ec",
        mchId: "1364986702",
        mchKey: "womendoushiwutaishanjingyinsidet",
        apiBaseURL: "https://api.weixin.qq.com/sns/oauth2/",
        oauth2BaseURL: "https://open.weixin.qq.com/connect/oauth2/authorize"
    }),
    sendPayUrl: function (res, payInfo) {
        var url = payurl + '?';
        var index = 0;
        for (var k in payInfo) {
            url += (index > 0) ? '&' + k + '=' + payInfo[k] : k + '=' + payInfo[k];
            index++;
        }
        url = encodeURIComponent(url);
        url = this.weixin.wrapRedirectURLByOath2Way(url);
        res.end(url);
    }
}


