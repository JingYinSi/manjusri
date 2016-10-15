/**
 * Created by sony on 2016/10/13.
 */
var manjusri = require('./wechat/manjusri'),
    accuvirtue = require('./wechat/accvirtue'),
    wechat = require('./wechat/wechat'),
    payment = require('./wechat/payment'),
    weixinModule = require('../modules/weixin');
var payURL = "/jingyin/manjusri/pay/confirm";

module.exports = {
    weixin: weixinModule({
        appId: "wx76c06da9928cd6c3",
        appSecret: "f4d498d87cf8641b83671a533c3999ec",
        mchId: "1364986702",
        mchKey: "womendoushiwutaishanjingyinsidet",
        apiBaseURL: "https://api.weixin.qq.com/sns/oauth2/",
        oauth2BaseURL: "https://open.weixin.qq.com/connect/oauth2/authorize"
    }),

    initRoutes: function (router) {
        router.route('/jingyin/wechat')
            .get(wechat.hook)
            .post(wechat.receive);

        router.route('/jingyin/manjusri')
            .get(manjusri.index);

        router.route('/jingyin/manjusri/accuvirtue')
            .get(accuvirtue.index)
            .post(accuvirtue.action);

        router.route(payURL)
            .get(payment.index);

        router.route('/jingyin/manjusri/pay/notify')
            .post(payment.payNotify);
    },

    sendPayUrl: function (res, payInfo) {
        var url = payURL + '?';
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