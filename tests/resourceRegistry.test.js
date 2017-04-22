/**
 * Created by sony on 2016/9/26.
 */
describe('资源', function () {
    describe('资源注册', function () {
        var resgistry;
        var request, app;
        var resourceDef, id, url, handler;

        beforeEach(function () {
            request = require('supertest');
            app = require('express')();
            resgistry = require('../modules/rest/resourceRegistry');

            id = 'foo resource'
            url = '/url/foo';
            handler = function (req, res) {
                res.json(200, {data: 'I am a foo'});
            };
        });

        it('注册一个GET服务', function (done) {
            resourceDef = {
                id: id,
                url: url,
                handler: handler
            }

            resgistry.register([resourceDef]);
            resgistry.attachTo(app);

            request(app)
                .get(url)
                .expect(200, {data: 'I am a foo'}, done);
        });
    });

    describe('Url模板', function () {
        var linkage;
        before(function () {
            linkage = require('../server/rests');
        });

        it('如果指定资源未注册，getLink返回null', function () {
            expect(linkage.getLink("not exist")).to.be.null;
        });

        it('getUrlTemplete', function () {
            expect(linkage.getUrlTemplete("profile")).eql("/jingyin/manjusri/lords/:openid/profile");
        });

        it('getLink', function () {
            expect(linkage.getLink("home")).eql("/jingyin/manjusri/index");
            expect(linkage.getLink("dailyVirtue")).eql("/jingyin/manjusri/dailyVirtue");
            expect(linkage.getLink("suixi")).eql("/jingyin/manjusri/suixi");
            expect(linkage.getLink("trans", {partId: "foo"})).eql('/jingyin/manjusri/trans/foo');
            expect(linkage.getLink("jiansi")).eql("/jingyin/manjusri/jiansi");
            expect(linkage.getLink("pray")).eql("/jingyin/manjusri/pray");
            expect(linkage.getLink("me")).eql("/jingyin/manjusri/lordvirtues");


            expect(linkage.getLink("virtue", {id: 234567})).eql("/jingyin/rest/virtues/234567");
            expect(linkage.getLink("pay", {virtue: 234567}))
                .eql("/jingyin/manjusri/pay/confirm?virtue=234567");
            expect(linkage.getLink("login")).eql("/jingyin/manjusri/login");
            expect(linkage.getLink("profile", {openid: '123456789'})).eql("/jingyin/manjusri/lords/123456789/profile");
        });

        it('获得主菜单URL', function () {
            expect(linkage.getMainMenuLinkages()).eql({
                home: "/jingyin/manjusri/index",
                jiansi: "/jingyin/manjusri/jiansi",
                pray: "/jingyin/manjusri/pray",
                lesson: "/jingyin/manjusri/lesson",
                lord: "/jingyin/manjusri/lordvirtues"
            });
        });
    });
})

