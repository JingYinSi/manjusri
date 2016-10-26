/**
 * Created by sony on 2016/10/13.
 */
const manjusri = require('./wechat/manjusri'),
    accuvirtue = require('./wechat/accvirtue'),
    suixi = require('./wechat/suixi'),
    wechat = require('./wechat/wechat'),
    payment = require('./wechat/payment'),
    payRoute = require('./payurl').payRoute;

module.exports = function (router) {
    router.route('/jingyin/wechat')
        .get(wechat.hook)
        .post(wechat.receive);

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

    router.route('/jingyin/manjusri/trans/:productId')
        .get(suixi.trans);
    /*
     .post(accuvirtue.action);*/

    router.route(payRoute)
        .get(payment.index);

    router.route('/jingyin/manjusri/pay/notify')
        .get(payment.result)
        .post(payment.payNotify);


    /*----------------------------old version ------------------------------------------  */

    router.route('/jingyin/manjusri')
        .get(manjusri.home);

    router.route('/jingyin/manjusri/accuvirtue')
        .get(accuvirtue.dailyVirtue)
        .post(accuvirtue.action);

}
