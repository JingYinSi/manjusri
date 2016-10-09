/**
 * Created by sony on 2016/9/18.
 */
var express = require('express'),
    router = express.Router(),
    home = require('../controllers/home'),
    image = require('../controllers/image'),
    manjusri = require('../controllers/manjusri'),
    accvirtue = require('../controllers/accvirtue'),
    wechat  = require('../controllers/wechat'),
    payment = require('../controllers/payment');

module.exports = function (app) {
    router.get('/', home.index);
    router.get('/images/:image_id', image.index);
    router.post('/images', image.create);
    router.post('/images/:image_id/like', image.like);
    router.post('/images/:image_id/comment', image.comment);
    router.delete('/images/:image_id', image.remove);

    router.get('/jingyin/wechat', wechat.hook);

    router.get('/jingyin/manjusri', manjusri.index);

    router.get('/jingyin/manjusri/accuvirtue', accvirtue.index);
    router.post('/jingyin/manjusri/accuvirtue', accvirtue.action);

    router.get('/jingyin/manjusri/pay/confirm', payment.index);
    router.post('/jingyin/manjusri/pay/notify', payment.payNotify);
    app.use(router);
};
