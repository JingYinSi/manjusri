/**
 * Created by sony on 2016/10/13.
 */
const manjusri = require('./wechat/manjusri'),
    manjusriPages = require('./wechat/manjusriPages'),
    linkages = require('./rests'),
    auth = require('./auth').manjusri,
    //login = require('./wechat/redirects'),
    payment = require('./wechat/payment'),
    part = require('./biz/part'),
    payRoute = require('./payurl').payRoute,
    statistics = require('./rest/statistics'),
    pray = require('./rest/pray');

var log4js = require('log4js');
log4js.configure("log4js.conf", {reloadSecs: 300});
var logger = log4js.getLogger();

const virtues = require('./rest/virtues');

module.exports = {
    attachTo: function (app) {
        app.get('/jingyin/manjusri/login', manjusri.login);
        app.get(linkages.getUrlTemplete('home'), manjusriPages.home);
        app.get(linkages.getUrlTemplete('dailyVirtue'), auth, manjusriPages.dailyVirtue);
        app.get(linkages.getUrlTemplete('suixi'), auth, manjusriPages.suixi);
        app.get(linkages.getUrlTemplete('jiansi'), manjusriPages.jiansi);
        app.get(linkages.getUrlTemplete('pray'), manjusriPages.pray);
        app.get('/jingyin/manjusri/trans/:partId', auth, manjusri.trans);
        app.get(payRoute, payment.pay);
        app.get('/jingyin/manjusri/pay/notify', payment.result);
        app.post('/jingyin/manjusri/pay/notify', virtues.paidNotify);
        app.get('/jingyin/manjusri/lordvirtues', auth, manjusri.lordVirtues);
        app.get('/jingyin/manjusri/lords/:openid/profile', auth, manjusri.lordProfile);
        app.put('/jingyin/manjusri/lords/:openid/profile', manjusri.updateLordProfile);

        /*----------------------------restful--------------------------------------------------*/
        app.post('/jingyin/rest/virtues/prepay', virtues.prepay);
        app.post('/jingyin/rests/manjusri/pray', pray.pray);
        app.get('/jingyin/rests/manjusri/statistics', statistics.query);
    }
}
