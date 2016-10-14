/**
 * Created by sony on 2016/9/26.
 */
var mongoose = require('mongoose'),
    proxyquire = require('proxyquire');

describe('静音寺业务系统', function () {
    describe('业务', function () {
        describe('捐助交易', function () {
            var Virtue;
            var amount;
            beforeEach(function (done) {
                Virtue = require('../server/wechat/models/virtue');
                amount = 45.8;
                mongoose.Promise = global.Promise;
                if (mongoose.connection.db) return done();
                mongoose.connect(dbURI, done);
            });

            afterEach(function (done) {
                clearDB(done);
            });

            it('创建一笔捐助，金额应大于零', function (done) {
                amount = 0;
                Virtue.placeVirtue(0, function (err, virtue) {
                    expect(err.errors['amount'].message).to.be.eql('金额应大于零');
                    expect(virtue).not.exist;
                    done();
                });
            });

            it('创建一笔捐助', function (done) {
                Virtue.placeVirtue(amount, function (err, virtue) {
                    expect(err).be.null;
                    expect(virtue.openId).not.exist;
                    expect(virtue.amount).to.be.equal(amount);
                    expect(virtue.state).to.be.equal('new');
                    expect(virtue.timestamp).to.be.a('date');
                    done();
                })
            });

            describe('功德主确认捐助', function (done) {
                var transId;
                beforeEach(function (done) {
                    Virtue.placeVirtue(amount, function (err, v) {
                        transId = v._id.toString();
                        done();
                    })
                });

                it('确认捐助', function (done) {
                    var opendId = 'foo openid';
                    Virtue.applyVirtue(transId, opendId, function (err, virtue) {
                        expect(err).not.exist;
                        expect(virtue._id.toString()).eql(transId);
                        expect(virtue.openid).eql(opendId);
                        expect(virtue.amount).eql(amount);
                        expect(virtue.state).eql('applied');
                        expect(virtue.timestamp).to.be.a('date');
                        done();
                    })
                });
            });
        });
    });

    describe('微信公众号', function () {
        describe('微信接口', function () {
            var weixinModule, stubs, weinxinConfig;
            var apiBaseURL, appid, appsecret, oauth2BaseURL;
            var mch_id, mch_key;
            var weixin;

            beforeEach(function () {
                apiBaseURL = 'apiBaseURL';
                appid = 'appid';
                appsecret = 'appsecret';
                oauth2BaseURL = 'oauth2BaseURL';
                mch_id = 'eveqveqfvfvff';
                mch_key = 'ddvebt rtbrt';

                weixinConfig = {
                    apiBaseURL: apiBaseURL,
                    appId: appid,
                    appSecret: appsecret,
                    oauth2BaseURL: oauth2BaseURL,
                    mch_id: mch_id,
                    mch_key: mch_key
                };
                stubs = {};
            });

            it("获得OpenId", function () {
                var code = '1234';
                var url = apiBaseURL + "access_token?appid="
                    + appid + "&secret=" + appsecret
                    + "&code=" + code + "&grant_type=authorization_code";
                var expectedOpenId = '123456789033';
                var dataFromWeixin = {openid: expectedOpenId};

                var concatStub = sinon.stub();
                concatStub.withArgs(url).callsArgWith(1, null, null, dataFromWeixin);
                stubs['simple-get'] = {concat: concatStub};

                weixinModule = proxyquire('../modules/weixin', stubs);
                weixin = weixinModule(weixinConfig);

                var callback = sinon.spy();
                weixin.getOpenId(code, callback);
                expect(callback).calledWith(expectedOpenId);
            });

            it('以OAuth2的形式wrap重定向Url', function () {
                var redirectUrl = 'http://localhost/foo';
                var wrapedUrl = oauth2BaseURL + "?appid=" + appid + "&redirect_uri="
                    + redirectUrl + "&response_type=code&scope=snsapi_base#wechat_redirect";
                expect(weixin.wrapRedirectURLByOath2Way(redirectUrl))
                    .eql(wrapedUrl);
            });

            it('微信下单', function () {
                var prePayId = 'prePayId';
                var order = {
                    foo: 'foo',
                    fee: 'fee'
                };
                var prepayOrderXML = '<xml><foo>prepayOrderXML</foo></xml>';
                var preparePrepayXmlStub = sinon.stub().withArgs(order).returns(prepayOrderXML);
                weixin.preparePrepayXml = preparePrepayXmlStub;

                var prePayRequestSenderStub = sinon.stub();
                prePayRequestSenderStub.withArgs(prepayOrderXML)
                    .callsArgWith(1, null, prePayId);
                weixin.sendPrepayRequest = prePayRequestSenderStub;

                var nonceStr = 'foo noncestr';
                var createNonceStrStub = sinon.stub().returns(nonceStr);
                weixin.createNonceStr = createNonceStrStub;

                var timestamp = '123456788'
                var createTimeStampStub = sinon.stub().returns(timestamp);
                weixin.createTimeStamp = createTimeStampStub;

                var payDataToSignMD5 = {
                    "appId": appid,
                    "timeStamp": timestamp,
                    "nonceStr": nonceStr,
                    "package": "prepay_id=" + prePayId,
                    "signType": "MD5"
                };
                var paySign = 'vefnnvqjenvrgn3rngqrgqrngqerngr';
                var signMD5Stub = sinon.stub().withArgs(payDataToSignMD5, mch_key).returns(paySign);
                weixin.signMD5 = signMD5Stub;

                var expectedPay = payDataToSignMD5;
                expectedPay.paySign = paySign;
                expectedPay.prepay_id = prePayId;

                var callback = sinon.spy();
                weixin.prePay(order, callback);
                expect(callback).calledWith(expectedPay);
            });

            it('准备微信支付单', function () {
                var parseStub = sinon.stub();
                stubs.js2xmlparser = {'parse': parseStub};
                expect(stubs.js2xmlparser.parse).eql(parseStub);
                weixinModule = proxyquire('../modules/weixin', stubs);
                weixin = weixinModule(weixinConfig);

                var order = {
                    foo: 'foo',
                    fee: 'fee'
                };
                var prepayOrder = Object.assign({}, order);
                prepayOrder.appid = appid;
                prepayOrder.mch_id = mch_id;

                var nonceStr = 'foo noncestr';
                var createNonceStrStub = sinon.stub().returns(nonceStr);
                weixin.createNonceStr = createNonceStrStub;
                prepayOrder.nonce_str = nonceStr;

                prepayOrder.trade_type = "JSAPI";

                var paySign = 'vefnnvqjenvrgn3rngqrgqrngqerngr';
                var signMD5Stub = sinon.stub().withArgs(prepayOrder, mch_key).returns(paySign);
                weixin.signMD5 = signMD5Stub;
                prepayOrder.sign = paySign;
                //prepayOrder.a = 'aaaaa';

                var prepayXml = '<xml><foo>prepayOrderXML</foo></xml>';
                parseStub.withArgs("xml", prepayOrder).returns(prepayXml);

                var result = weixin.preparePrepayOrderXml(order);
                expect(result).xml.to.be.equal(prepayXml);
            });

            it('发送微信支付下单请求', function () {
                var xmlToPost = '<xml><foo>foo</foo><fee>...</fee></xml>';
                var options = {
                    url: "https://api.mch.weixin.qq.com:443/pay/unifiedorder",
                    method: "POST",
                    headers: {
                        "content-type": "application/xml",  // <--Very important!!!
                    },
                    body: xmlToPost
                };

                var prepayId = 'ffdbsrt4tn4tn4';
                var requestStub = sinon.stub();
                requestStub.withArgs(options).callsArgWith(1, null, prepayId);
                weixinModule = proxyquire('../modules/weixin', {request: requestStub});
                weixin = weixinModule(weixinConfig);

                var callbackSpy = sinon.spy();
                weixin.sendPrepayRequest(xmlToPost, callbackSpy);
                expect(callbackSpy).calledWith(null, prepayId);
            });

            it('MD5签名', function () {
                var data = {
                    sss: 1,
                    a: 567,
                    bbb: 2
                };
                var val = weixin.signMD5(data, 'wdfkwjdfkerjgirg');
                expect(val).eql('399BCE1827E0B40C633C9A5CF892AFE6');
            });
        });

        describe('服务端控制', function () {
            xit('配置路由', function () {
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
            });

            describe('处理请求', function () {
                it('显示首页', function () {
                    var controller = require('../server/wechat/manjusri').index;
                    var resRenderSpy = sinon.spy();
                    var resStub = {render: resRenderSpy}

                    controller(null, resStub);

                    expect(resRenderSpy).calledWith('wechat/manjusri');
                });

            });

        })
    })
})
