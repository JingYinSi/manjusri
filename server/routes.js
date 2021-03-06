/**
 * Created by sony on 2016/10/13.
 */
const manjusri = require('./wechat/manjusri'),
    manjusriPages = require('./wechat/manjusriPages'),
    linkages = require('./rests'),
    auth = require('./auth'),
    passport = require('passport'),
    payment = require('./wechat/payment'),
    part = require('./biz/part'),
    payRoute = require('./payurl').payRoute,
    statistics = require('./rest/statistics'),
    lords = require('./rest/lords'),
    pray = require('./rest/prays'),
    practices = require('./rest/practices'),
    logger = require('@finelets/hyper-rest/app/Logger');

const virtues = require('./rest/virtues');

module.exports = {
    attachTo: function (app) {
        app.get('/jingyin/manjusri/login', manjusri.login);
        app.get(linkages.getUrlTemplete('home'), manjusriPages.home);
        app.get(linkages.getUrlTemplete('dailyVirtue'), auth, manjusriPages.dailyVirtue);
        app.get(linkages.getUrlTemplete('suixi'), auth, manjusriPages.suixi);
        app.get(linkages.getUrlTemplete('jiansi'), manjusriPages.jiansi);

        app.get(linkages.getUrlTemplete('pray'), auth, manjusriPages.examPray);
        app.get(linkages.getUrlTemplete('examPray'), auth, manjusriPages.examPray);
        app.get(linkages.getUrlTemplete('lesson'), auth, manjusriPages.lesson);
        app.get(linkages.getUrlTemplete('practics'), auth, manjusriPages.practics);
        app.get('/jingyin/manjusri/trans/:partId', auth, manjusri.trans);

        app.get('/jingyin/manjusri/pay/confirm', auth, payment.pay);
        app.get(linkages.getUrlTemplete('weixinPaymentNotify'), payment.result);
        app.post(linkages.getUrlTemplete('weixinPaymentNotify'), virtues.paidNotify);
        app.get('/jingyin/manjusri/lordvirtues', auth, manjusriPages.lordVirtues);

        app.get(linkages.getUrlTemplete('profile'), auth, manjusriPages.lordProfile);
        app.put('/jingyin/manjusri/lords/:openid/profile', auth, manjusri.updateLordProfile);

        /*----------------------------restful--------------------------------------------------*/
        //TODO:重构这里的prepay restful服务
        app.post(linkages.getUrlTemplete('prepay'), auth, virtues.prepay);
        app.get(linkages.getUrlTemplete('lord'), lords.lord);
        app.get(linkages.getUrlTemplete('lordPray'), pray.pray);
        app.post(linkages.getUrlTemplete('lordPrays'), pray.add);
        app.post(linkages.getUrlTemplete('lessonsResource'), practices.addLesson);
        app.get(linkages.getUrlTemplete('lessonPractices'), practices.getLessonPractices);
        app.post(linkages.getUrlTemplete('lessonPractices'), auth, practices.announcePractice);
        app.get(linkages.getUrlTemplete('manjusriStatistics'), statistics.query);

        app.get('/jingyin/rests/pray/print', pray.print);
        app.get('/jingyin/rests/manjusri/index', statistics.index);

        /*------------------------------ Biz view--------------------------------------------------*/
        app.get('/jingyin/biz', function (req, res) {
            res.render('biz/home', {
                user: req.user
            });
        });

        //displays our signup page
        app.get('/jingyin/biz/signin', function (req, res) {
            res.render('biz/signin');
        });

        //sends the request through our local signup strategy, and if successful takes user to homepage, otherwise returns then to signin page
        app.post('/jingyin/biz/local-reg', passport.authenticate('local-signup', {
            successRedirect: '/jingyin/biz',
            failureRedirect: '/jingyin/biz/signin'
        }));

        //sends the request through our local login/signin strategy, and if successful takes user to homepage, otherwise returns then to signin page
        app.post('/jingyin/biz/login', passport.authenticate('local-signin', {
            successRedirect: '/jingyin/biz',
            failureRedirect: '/jingyin/biz/signin'
        }));

        //logs user out of site, deleting them from the session, and returns to homepage
        app.get('/jingyin/biz/logout', function (req, res) {
            var name = req.user.username;
            console.log("LOGGIN OUT " + req.user.username)
            req.logout();
            res.redirect('/jingyin/biz');
            req.session.notice = "You have successfully been logged out " + name + "!";
        });


        //app.get('/jingyin/payment/share', paymentShare.result);
    }
}