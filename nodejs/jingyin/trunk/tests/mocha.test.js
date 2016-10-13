/**
 * Created by sony on 2016/9/26.
 */
var wepay = require('../modules/wepay'),
    js2xmlparser = require('js2xmlparser'),
    parseStringToJs = require('xml2js').parseString,
    mongoose = require('mongoose'),
    proxyquire = require('proxyquire'),
    assert = require('assert');

describe('静音寺业务系统', function () {
    describe('业务', function () {
        describe('捐助交易', function () {
            beforeEach(function (done) {
                if (mongoose.connection.db) return done();
                mongoose.connect(dbURI, done);
            });

            afterEach(function (done) {
                clearDB(done);
            });

            it('创建一笔捐助，金额应大于零', function (done) {
                var Virtue = require('../server/wechat/models/virtue');
                var amount = 0;
                Virtue.placeVirtue(0, function (err, virtue) {
                    expect(err.errors['amount'].message).to.be.eql('金额应大于零');
                    expect(virtue).not.exist;
                    done();
                });
            });

            it('创建一笔捐助', function (done) {
                var Virtue = require('../server/wechat/models/virtue');
                var amount = 45.8;
                Virtue.placeVirtue(amount, function (err, virtue) {
                    expect(err).be.null;
                    expect(virtue.openId).not.exist;
                    expect(virtue.amount).to.be.equal(amount);
                    expect(virtue.state).to.be.equal('new');
                    expect(virtue.timestamp).to.be.a('date');
                    done();
                })
            })
        })
    });

    describe('微信公众号', function () {
        describe('微信接口', function () {
            it("获得OpenId", function () {
                var apiBaseURL = 'apiBaseURL',
                    appid = 'appid',
                    appsecret = 'appsecret';

                var code = '1234';
                var url = apiBaseURL + "access_token?appid="
                    + appid + "&secret=" + appsecret
                    + "&code=" + code + "&grant_type=authorization_code";
                var expectedOpenId = '123456789033';
                var dataFromWeixin = {openid: expectedOpenId};

                /*var concatStub = sinon.stub().withArgs(url + 'aaaaa')
                 .callsArgWith(1, null, null, dataFromWeixin),*/
                var simpleget = {
                    concat: function (apiurl, ck) {
                        expect(apiurl).eql(url);
                        ck(null, null, dataFromWeixin);
                    }
                };
                var weixinModule = proxyquire('../modules/weixin', {'simple-get': simpleget});
                var weixin = weixinModule({
                    apiBaseURL: 'apiBaseURL',
                    appId: 'appid',
                    appSecret: 'appsecret'
                });
                weixin.getOpenId(code, function (data) {
                    expect(data).to.be.eql(expectedOpenId);
                });
            });

            it('以OAuth2的形式wrap重定向Url', function () {
                var appid = 'appid';
                var oauth2BaseURL = 'any oauth2BaseURL';
                var weixinModule = require('../modules/weixin');
                var weixin = weixinModule({
                    appId: 'appid',
                    oauth2BaseURL: oauth2BaseURL
                });
                var redirectUrl = 'http://localhost/foo';
                var wrapedUrl = oauth2BaseURL + "?appid=" + appid + "&redirect_uri="
                    + redirectUrl + "&response_type=code&scope=snsapi_base#wechat_redirect";
                expect(weixin.wrapRedirectURLByOath2Way(redirectUrl))
                    .eql(wrapedUrl);
            });

            describe('tech test', function () {
                it('对参数按照key=value的格式，并按照参数名ASCII字典序排序', function () {
                    var data = {
                        sss: 1,
                        a: 567,
                        bbb: 2
                    };
                    var val = wepay.keyvaluesort(data);
                    expect(val).to.equal('a=567&bbb=2&sss=1');
                });

                it('MD5签名', function () {
                    var data = {
                        sss: 1,
                        a: 567,
                        bbb: 2
                    };
                    var val = wepay.signMD5(data, 'wdfkwjdfkerjgirg');
                    assert.equal('399BCE1827E0B40C633C9A5CF892AFE6', val);
                });

                it('SHA1签名', function () {
                    var data = {
                        sss: 1,
                        a: 567,
                        bbb: 2
                    };
                    var val = wepay.signSHA1(data, 'wdfkwjdfkerjgirg');
                    assert.equal('7E413C0212F21CF787F45FAD3A0EAC98E0D6CA61', val);
                });

                it('将JSON转为以xml为根的XML', function () {
                    var data = {
                        sss: 1,
                        a: 567,
                        bbb: 2
                    };
                    var val = js2xmlparser.parse("xml", data);
                    console.log(val);
                });
                it('读取XML字符串', function () {
                    var xmlstr = '<xml><result_code>xxxxxx</result_code><prepay_id><![CDATA[wx201610042139059db09c090a0428534885]]></prepay_id></xml>';
                    var json;
                    parseStringToJs(xmlstr, function (err, result) {
                        assert.equal(null, err);
                        json = result;

                    });

                    //console.log(json);
                    var result = json.xml.prepay_id;
                    assert.equal('wx201610042139059db09c090a0428534885', result);
                });
            })
        });

        describe('服务端控制', function () {
            it('配置路由', function () {
                var routesModule = require('../server/services');
                var manjusri = require('../server/wechat/manjusri'),
                    accuvirtue = require('../server/wechat/accvirtue'),
                    wechat = require('../server/wechat/wechat'),
                    payment = require('../server/wechat/payment');
                var getSpy = sinon.stub(),
                    postSpy = sinon.spy(),
                    putSpy = sinon.stub(),
                    deleteSpy = sinon.stub();

                var handlerStub = {
                    get: getSpy,
                    post: postSpy,
                    put: postSpy,
                    delete: deleteSpy
                }
                var routeStub = sinon.stub();
                routeStub.withArgs('/jingyin/wechat').returns(handlerStub);
                routeStub.withArgs('/jingyin/manjusri').returns(handlerStub);
                routeStub.withArgs('/jingyin/manjusri/accuvirtue').returns(handlerStub);
                routeStub.withArgs('/jingyin/manjusri/pay/confirm').returns(handlerStub);
                routeStub.withArgs('/jingyin/manjusri/pay/notify').returns(handlerStub);

                getSpy.withArgs(wechat.hook).returns(handlerStub);
                //getSpy.withArgs(manjusri.index).returns(handlerStub);
                getSpy.withArgs(accuvirtue.index).returns(handlerStub);
                getSpy.withArgs(payment.index).returns(handlerStub);

                routesModule.initRoutes({route: routeStub});


                expect(getSpy).calledWith(manjusri.index);

                expect(postSpy).calledWith(wechat.receive);
                expect(postSpy).calledWith(accuvirtue.action);
                expect(postSpy).calledWith(payment.payNotify);
            });

            it('向客户端发送可重定向的支付请求的Url', function () {

                var routes = require('../server/services');

                var resEndSpy = sinon.spy();
                var info = {
                    foo: 'foo',
                    fee: 'fee',
                    fuu: 'fuu',
                }
                var expectedUrl = '/jingyin/manjusri/pay/confirm?foo=foo&fee=fee&fuu=fuu'
                var expectedOAuthUrl = 'expectedOAuthUrl';
                var warpstub = sinon.stub();
                routes.weixin = {wrapRedirectURLByOath2Way: warpstub};
                warpstub.withArgs(expectedUrl).returns(expectedOAuthUrl);

                routes.sendPayUrl({end: resEndSpy}, info);
                expect(resEndSpy).calledWith(expectedOAuthUrl);
            })

        })
    })
})
