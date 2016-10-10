var manjusri = require('./wechat/manjusri'),
    accuvirtue = require('./wechat/accvirtue'),
    wechat  = require('./wechat/wechat'),
    payment = require('./wechat/payment');

module.exports = function(router) {
    router.route('/jingyin/wechat')
        .get(wechat.hook);

    router.route('/jingyin/manjusri')
        .get(manjusri.index);

    router.route('/jingyin/manjusri/accuvirtue')
        .get(accuvirtue.index)
        .post(accuvirtue.action);

    router.route('/jingyin/manjusri/pay/confirm')
        .get(payment.index);

    router.route('/jingyin/manjusri/pay/notify')
        .post(payment.payNotify);
};
