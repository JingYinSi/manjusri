/**
 * Created by sony on 2016/10/13.
 */
const manjusri = require('./wechat/manjusri'),
    manjusriPages = require('./wechat/manjusriPages'),
    linkages = require('./rests'),
    login = require('./wechat/redirects'),
    payment = require('./wechat/payment'),
    part = require('./biz/part'),
    payRoute = require('./payurl').payRoute,
    statistics = require('./rest/statistics');

var log4js = require('log4js');
log4js.configure("log4js.conf", {reloadSecs: 300});
var logger = log4js.getLogger();

const virtues = require('./rest/virtues');


module.exports = function (router) {
    router.route('/jingyin/manjusri/login')
        .get(manjusri.login);

    router.route(linkages.getUrlTemplete('home'))
        .get(manjusriPages.home);

    router.route(linkages.getUrlTemplete('dailyVirtue'))
        .get(manjusriPages.dailyVirtue);

    router.route(linkages.getUrlTemplete('suixi'))
        .get(manjusriPages.suixi);

    router.route(linkages.getUrlTemplete('jiansi'))
        .get(manjusriPages.jiansi);

    router.route(linkages.getUrlTemplete('pray'))
        .get(manjusriPages.pray);

    router.route('/jingyin/manjusri/trans/:partId')
        .get(manjusri.trans);

    router.route(payRoute)
        .get(payment.pay);

    router.route('/jingyin/manjusri/pay/notify')
        .get(payment.result)
        .post(virtues.paidNotify);

    router.route('/jingyin/manjusri/lordvirtues')
        .get(manjusri.lordVirtues);

    router.route('/jingyin/manjusri/lords/:openid/profile')
        .get(manjusri.lordProfile)
        .put(manjusri.updateLordProfile);

    /*----------------------------restful--------------------------------------------------*/
    router.route('/jingyin/rest/virtues/prepay')
        .post(virtues.prepay);
    router.route('/jingyin/rests/manjusri/statistics')
        .get(statistics.query);
    /*router.route('/jingyin/rest/virtues/:id')
     .put(virtues.paid);*/
    /*router.route('/jingyin/rest/virtues')
     .get(virtues.list);*/

    /*----------------------------业务系统------------------------------------------  */
    /* router.route('/jingyin/biz/parts/index')
     .get(part.index);*/
}
