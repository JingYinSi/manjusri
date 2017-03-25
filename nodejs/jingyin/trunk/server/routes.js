/**
 * Created by sony on 2016/10/13.
 */
const manjusri = require('./wechat/manjusri'),
    login = require('./wechat/redirects'),
    payment = require('./wechat/payment'),
    part = require('./biz/part'),
    payRoute = require('./payurl').payRoute;

const virtues = require('./rest/virtues');

var auth = function (req, res, next) {
    var sess = req.session;
    if (!sess.user){
        req.session.redirectToUrl = req.originalUrl;
        return redirects.toLogin(req, res);
    }
    return next();
}

module.exports = function (router) {
    router.route('/jingyin/manjusri/login')
        .get(manjusri.login);

    router.route('/jingyin/manjusri/index')
        .get(manjusri.home);

    router.route('/jingyin/manjusri/jiansi')
        .get(manjusri.jiansi);

    router.route('/jingyin/manjusri/dailyvirtue')
        .get(manjusri.dailyVirtue);

    router.route('/jingyin/manjusri/suixi')
        .get(manjusri.suixi);

    router.route('/jingyin/manjusri/trans/:partId')
        .get(manjusri.trans);

    router.route(payRoute)
        .get(payment.pay);

    router.route('/jingyin/manjusri/pay/notify')
        .get(payment.result)
        .post(virtues.paidNotify);

    router.route('/jingyin/manjusri/lordvirtues', auth)
        .get(manjusri.lordVirtues);

    //TODO:最终应设为：/jingyin/manjusri/lords/:openid/profile
    router.route('/jingyin/manjusri/lord/profile')
        .get(manjusri.lordProfile);


    /*----------------------------restful--------------------------------------------------*/
    router.route('/jingyin/rest/virtues/prepay')
        .post(virtues.prepay);
    /*router.route('/jingyin/rest/virtues/:id')
     .put(virtues.paid);*/
    /*router.route('/jingyin/rest/virtues')
     .get(virtues.list);*/

    /*----------------------------业务系统------------------------------------------  */
    /* router.route('/jingyin/biz/parts/index')
     .get(part.index);*/
}
