/**
 * Created by sony on 2016/10/13.
 */
const site = require('./wechat/site'),
    manjusri = require('./wechat/manjusri'),
    accuvirtue = require('./wechat/accvirtue'),
    wechat = require('./wechat/wechat'),
    payment = require('./wechat/payment'),
    payRoute = require('./payurl').payRoute;

module.exports = function (router) {
    router.route('/')
        .get(site.root);

    router.route('/jingyin/wechat')
        .get(wechat.hook)
        .post(wechat.receive);

    router.route('/jingyin/manjusri')
        .get(manjusri.index);

    router.route('/jingyin/manjusri/accuvirtue')
        .get(accuvirtue.index)
        .post(accuvirtue.action);

    router.route(payRoute)
        .get(payment.index);

    router.route('/jingyin/manjusri/pay/notify')
        .post(payment.payNotify);
}
