var manjusri = require('./wechat/manjusri'),
    accuvirtue = require('./wechat/accvirtue'),
    wechat  = require('./wechat/wechat'),
    payment = require('./wechat/payment');

module.exports = function(route) {
    route('/jingyin/wechat')
        .get(wechat.hook);

    route('/jingyin/manjusri')
        .get(manjusri.index);

    route('/jingyin/manjusri/accuvirtue')
        .get(accuvirtue.index)
        .post(accuvirtue.action);

    route('/jingyin/manjusri/pay/confirm')
        .get(payment.index);

    route('/jingyin/manjusri/pay/notify')
        .post(payment.payNotify);
};
