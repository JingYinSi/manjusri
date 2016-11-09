/**
 * Created by sony on 2016/10/13.
 */
const manjusri = require('./wechat/manjusri'),
    accuvirtue = require('./wechat/accvirtue'),
    suixi = require('./wechat/suixi'),
    payment = require('./wechat/payment'),
    part = require('./biz/part'),
    payRoute = require('./payurl').payRoute;

const virtues = require('./rest/virtues');

module.exports = function (router) {
    router.route('/jingyin/manjusri/index')
        .get(manjusri.home);

    router.route('/jingyin/manjusri/jiansi')
        .get(manjusri.jiansi);

    router.route('/jingyin/manjusri/dailyvirtue')
        .get(accuvirtue.dailyVirtue)
        .post(accuvirtue.action);

    router.route('/jingyin/manjusri/suixi')
        .get(suixi.index)
        .post(accuvirtue.action);

    router.route('/jingyin/manjusri/trans/:partId')
        .get(suixi.trans)
        .post(accuvirtue.action);

    router.route(payRoute)
        .get(payment.index);

    router.route('/jingyin/manjusri/pay/notify')
        .get(payment.result);
        //.post(payment.payNotify);


    /*----------------------------restful--------------------------------------------------*/
    router.route('/jingyin/rest/virtue/prepay')
        .post(virtues.prepay);
    router.route('/jingyin/rest/virtues/:id')
        .put(virtues.paid);

    /*----------------------------old version ------------------------------------------  */

    router.route('/jingyin/manjusri')
        .get(manjusri.home);

    router.route('/jingyin/manjusri/accuvirtue')
        .get(accuvirtue.dailyVirtue)
        .post(accuvirtue.action);

    /*----------------------------业务系统------------------------------------------  */
    router.route('/jingyin/biz/parts/index')
        .get(part.index);
}
