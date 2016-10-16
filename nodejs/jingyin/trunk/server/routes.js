/**
 * Created by sony on 2016/10/13.
 */
const manjusri = require('./wechat/manjusri'),
    accuvirtue = require('./wechat/accvirtue'),
    wechat = require('./wechat/wechat'),
    payment = require('./wechat/payment'),
    payurl = require('./payurl');

module.exports = function (router) {
    router.route('/jingyin/wechat')
        .get(wechat.hook)
        .post(wechat.receive);

    router.route('/jingyin/manjusri')
        .get(manjusri.index);

    router.route('/jingyin/manjusri/accuvirtue')
        .get(accuvirtue.index)
        .post(accuvirtue.action);

    router.route(payurl)
        .get(payment.index);

    router.route('/jingyin/manjusri/pay/notify')
        .post(payment.payNotify);
}
