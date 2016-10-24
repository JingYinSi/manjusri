/**
 * Created by sony on 2016/9/26.
 */
var mongoose = require('mongoose'),
    XML = require('pixl-xml'),
    js2xmlparser = require('js2xmlparser'),
    proxyquire = require('proxyquire');

describe('静音寺业务系统', function () {
    describe('业务', function () {
        describe('捐助交易', function () {
            var Virtue;
            var openid, amount;
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
                amount = 25.78;
                openid = "foo";
                Virtue.placeVirtue(openid, 0, function (err, virtue) {
                    expect(err.errors['amount'].message).to.be.eql('金额应大于零');
                    expect(virtue).not.exist;
                    done();
                });
            });

            it.skip('创建一笔捐助，未定义openId', function (done) {
                amount = 32.8;
                Virtue.placeVirtue(null, amount, function (err, virtue) {
                    expect(err.errors['openid'].message).to.be.eql('OpenId必须定义');
                    expect(virtue).not.exist;
                    done();
                });
            });

            it('创建一笔捐助', function (done) {
                Virtue.placeVirtue(openid, amount, function (err, virtue) {
                    expect(err).be.null;
                    expect(virtue.openid).eql(openid);
                    expect(virtue.amount).to.be.equal(amount);
                    expect(virtue.state).to.be.equal('new');
                    expect(virtue.timestamp).to.be.a('date');
                    done();
                })
            });

            describe('捐助支付', function (done) {
                var transId;
                beforeEach(function (done) {
                    Virtue.placeVirtue(openid, amount, function (err, virtue) {
                        expect(err).not.exist;
                        transId = virtue._id.toString();
                        done();
                    })
                });

                it('支付成功', function (done) {
                    Virtue.havePayed(transId, function (err, virtue) {
                        expect(err).not.exist;
                        expect(virtue._id.toString()).eql(transId);
                        expect(virtue.state).eql('payed');
                        done();
                    })
                })
            })
        });
    });

    describe('微信公众号', function () {
        describe('微信接口', function () {
            var weixinModule, stubs, weixinConfig;
            var apiBaseURL, appid, appsecret, oauth2BaseURL;
            var mch_id, mch_key;
            var weixin;

            beforeEach(function () {
                apiBaseURL = 'apiBaseURL';
                appid = 'appid';
                appsecret = 'appsecret';
                oauth2BaseURL = 'oauth2BaseURL';
                mch_id = 'eveqveqfvfvff';
                mch_key = 'womendoushiwutaishanjingyinsidet'; //-----IT IS VERY IMPORTMENT

                weixinConfig = {
                    apiBaseURL: apiBaseURL,
                    appId: appid,
                    appSecret: appsecret,
                    oauth2BaseURL: oauth2BaseURL,
                    mchId: mch_id,
                    mchKey: mch_key
                };
                stubs = {};
                weixinModule = require('../modules/weixin');
                weixin = weixinModule(weixinConfig);
            });

            it("获得OpenId", function () {
                var code = '1234';
                var url = apiBaseURL + "access_token?appid="
                    + appid + "&secret=" + appsecret
                    + "&code=" + code + "&grant_type=authorization_code";
                var expectedOpenId = '123456789033';
                var dataFromWeixin = Buffer.from(JSON.stringify({openid: expectedOpenId}));

                var concatStub = sinon.stub();
                concatStub.withArgs(url).callsArgWith(1, null, null, dataFromWeixin);
                stubs['simple-get'] = {concat: concatStub};

                weixinModule = proxyquire('../modules/weixin', stubs);
                weixin = weixinModule(weixinConfig);

                var callback = sinon.spy();
                weixin.getOpenId(code, callback);
                expect(callback).calledWith(null, expectedOpenId);
            });

            it('以OAuth2的形式wrap重定向Url', function () {
                var redirectUrl = 'http://localhost/foo';
                var wrapedUrl = oauth2BaseURL + "?appid=" + appid + "&redirect_uri="
                    + redirectUrl + "&response_type=code&scope=snsapi_base#wechat_redirect";
                expect(weixin.wrapRedirectURLByOath2Way(redirectUrl))
                    .eql(wrapedUrl);
            });

            it('准备微信支付单', function () {
                var openId = 'foo-openid',
                    transId = 'transOrderNo',
                    transName = 'transOrder description',
                    amount = 58.7;
                var nonceStr = 'foo noncestr';
                var paySign = 'vefnnvqjenvrgn3rngqrgqrngqerngr';
                var prepayXml = '<xml><foo>prepayOrderXML</foo></xml>';

                var prepayOrderToSign = {
                    out_trade_no: transId,
                    body: transName,
                    detail: transName,
                    notify_url: "http://jingyintemple.top/jingyin/manjusri/pay/notify",
                    openid: openId,
                    spbill_create_ip: "121.41.93.210",
                    total_fee: amount,
                    attach: "静音",
                    appid: appid,
                    mch_id: mch_id,
                    nonce_str: nonceStr,
                    trade_type: "JSAPI",
                };
                var prepayOrderToXml = Object.assign({}, prepayOrderToSign);
                prepayOrderToXml.sign = paySign;

                var createNonceStrStub = sinon.stub().returns(nonceStr);
                var signMD5Stub = sinon.stub().withArgs(prepayOrderToSign, mch_key).returns(paySign);
                var parseStub = sinon.stub();
                parseStub.withArgs("xml", prepayOrderToXml).returns(prepayXml);

                stubs.js2xmlparser = {'parse': parseStub};
                weixinModule = proxyquire('../modules/weixin', stubs);
                weixin = weixinModule(weixinConfig);
                weixin.createNonceStr = createNonceStrStub;
                weixin.signMD5 = signMD5Stub;

                var result = weixin.preparePrepayOrderXml(openId, transId, transName, amount);
                expect(result).xml.to.be.equal(prepayXml);
            });

            it('微信下单', function () {
                var prePayId = 'prePayId';
                var openId = 'foo-openid',
                    transId = 'transOrderNo',
                    transName = 'transOrder description',
                    amount = 58.7;

                var prepayOrderXML = '<xml><foo>prepayOrderXML</foo></xml>';
                var preparePrepayXmlStub = sinon.stub().withArgs(openId, transId, transName, amount).returns(prepayOrderXML);
                weixin.preparePrepayOrderXml = preparePrepayXmlStub;

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

                var expectedPay = Object.assign({}, payDataToSignMD5);
                ;
                expectedPay.paySign = paySign;
                expectedPay.prepay_id = prePayId;

                var callback = sinon.spy();
                weixin.prePay(openId, transId, transName, amount, callback);
                expect(callback).calledWith(expectedPay);
            });

            it('发送微信支付下单请求', function () {
                var resData = "<xml><return_code><![CDATA[SUCCESS]]></return_code>" +
                    "<return_msg><![CDATA[OK]]></return_msg>" +
                    " <appid><![CDATA[wx76c06da9928cd6c3]]></appid>" +
                    " <mch_id><![CDATA[1364986702]]></mch_id>" +
                    " <nonce_str><![CDATA[zaLzjsStxOwOc3YE]]></nonce_str>" +
                    " <sign><![CDATA[E54FA374A497C3E38329A3E6AEFEB53A]]></sign>" +
                    " <result_code><![CDATA[SUCCESS]]></result_code> " +
                    "<prepay_id><![CDATA[wx2016102016134724083f65cd0642279411]]></prepay_id>" +
                    " <trade_type><![CDATA[JSAPI]]></trade_type></xml>";
                var xmlToPost = '<xml><foo>foo</foo><fee>...</fee></xml>';
                var options = {
                    hostname: "api.mch.weixin.qq.com",
                    port: "443",
                    path: "/pay/unifiedorder",
                    method: "POST",
                    headers: {
                        'Content-Type': 'application/xml',  // <--Very important!!!
                        "Content-Length": Buffer.byteLength(xmlToPost)
                    }
                };

                var requestStub = sinon.stub();
                requestStub.withArgs(options, xmlToPost).callsArgWith(2, resData);
                weixin.sendHttpsRequest = requestStub;

                var callbackSpy = sinon.spy();
                weixin.sendPrepayRequest(xmlToPost, callbackSpy);
                expect(callbackSpy).calledWith(null, 'wx2016102016134724083f65cd0642279411');
            });

            describe('MD5签名', function () {
                var md5Stub, signResult, data;
                beforeEach(function () {
                    signResult = 'ddjfvndfnvdfgbsfbfg';
                    data = {
                        sss: 1,
                        a: 567,
                        bbb: 2
                    };
                    md5Stub = sinon.stub();
                    stubs['md5'] = md5Stub;
                    weixinModule = proxyquire('../modules/weixin', stubs);
                    weixin = weixinModule(weixinConfig);
                });

                it('MD5签名-指定KEY值', function () {
                    var key = 'wdfkwjdfkerjgirg';
                    md5Stub.withArgs("a=567&bbb=2&sss=1&key=" + key).returns(signResult);
                    expect(weixin.signMD5(data, key)).eql(signResult.toUpperCase());
                });

                it('MD5签名-KEY值缺省采用商户号mch_id', function () {
                    var key = mch_key;
                    md5Stub.withArgs("a=567&bbb=2&sss=1&key=" + key).returns(signResult);
                    expect(weixin.signMD5(data)).eql(signResult.toUpperCase());
                });
            })


            describe('检验微信支付结果', function () {
                var paymentXml, paymentJsonToSign, signMD5Stub;
                beforeEach(function () {
                    paymentXml = '<xml>' +
                        '<appid><![CDATA[wx76c06da9928cd6c3]]></appid>' +
                        ' <attach><![CDATA[?..]]></attach>' +
                        ' <bank_type><![CDATA[GDB_CREDIT]]></bank_type>' +
                        ' <cash_fee><![CDATA[5]]></cash_fee>' +
                        ' <fee_type><![CDATA[CNY]]></fee_type>' +
                        ' <is_subscribe><![CDATA[Y]]></is_subscribe>' +
                        ' <mch_id><![CDATA[1364986702]]></mch_id>' +
                        ' <nonce_str><![CDATA[fmbg238xoxfde7b]]></nonce_str>' +
                        ' <openid><![CDATA[o0ghywcfW_2Dp4oN-7NADengZAVM]]></openid>' +
                        ' <out_trade_no><![CDATA[58088e7a253a72789bec6d98]]></out_trade_no>' +
                        ' <result_code><![CDATA[SUCCESS]]></result_code>' +
                        ' <return_code><![CDATA[SUCCESS]]></return_code>' +
                        ' <sign><![CDATA[4C59A329EE4E7D35BE7FC840C599F6FE]]></sign>' +
                        ' <time_end><![CDATA[20161020172940]]></time_end>' +
                        ' <total_fee>5</total_fee> ' +
                        '<trade_type><![CDATA[JSAPI]]></trade_type>' +
                        ' <transaction_id><![CDATA[4005172001201610207217503606]]></transaction_id>' +
                        ' </xml>';
                    paymentJsonToSign = XML.parse(paymentXml);
                    delete paymentJsonToSign.sign;

                    signMD5Stub = sinon.stub();
                    signMD5Stub.withArgs(paymentJsonToSign).returns('4C59A329EE4E7D35BE7FC840C599F6FE');
                    weixin.signMD5 = signMD5Stub;
                });

                it('验证无误', function () {
                    var obj = weixin.parsePaymentNotification(paymentXml);
                    expect(obj.pass()).to.be.true;
                    expect(obj.getOutTradeNo()).eql('58088e7a253a72789bec6d98');
                    var responseBodyXML = "<xml><return_code>SUCCESS</return_code><return_msg>OK</return_msg></xml>"
                    expect(obj.replyOK()).xml.equal(responseBodyXML);
                })
            })
        });

        describe('服务端控制', function () {
            describe('路由器', function () {
                beforeEach(function () {

                });

                it('配置路由', function () {
                    var manjusri = require('../server/wechat/manjusri'),
                        accuvirtue = require('../server/wechat/accvirtue'),
                        wechat = require('../server/wechat/wechat'),
                        payment = require('../server/wechat/payment'),
                        routes = require('../server/routes');
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
                    routeStub.withArgs('/jingyin/manjusri/index').returns(handlerStub);
                    routeStub.withArgs('/jingyin/manjusri/dailyvirtue').returns(handlerStub);
                    routeStub.withArgs('/jingyin/manjusri/accuvirtue').returns(handlerStub);
                    routeStub.withArgs('/jingyin/manjusri/pay/confirm').returns(handlerStub);
                    routeStub.withArgs('/jingyin/manjusri/pay/notify').returns(handlerStub);

                    getSpy.withArgs(wechat.hook).returns(handlerStub);
                    getSpy.withArgs(accuvirtue.dailyVirtue).returns(handlerStub);
                    getSpy.withArgs(accuvirtue.index).returns(handlerStub);
                    getSpy.withArgs(payment.index).returns(handlerStub);

                    routes({route: routeStub});


                    expect(getSpy).calledWith(manjusri.index);

                    expect(postSpy).calledWith(wechat.receive);
                    expect(postSpy).calledWith(accuvirtue.action);
                    expect(postSpy).calledWith(payment.payNotify);
                });

                it('向客户端发送可重定向的支付请求的1', function () {
                    var payurl = 'http://payurl';
                    var expectedUrl = 'http://expected/url';
                    var valNeedEncode = '可能有中文';
                    var info = {
                        foo: 'foo',
                        fee: valNeedEncode,
                        fuu: 'fuu',
                    };
                    var expectedUrlToWrap = payurl + "?foo=foo&fee=" + encodeURIComponent(valNeedEncode) + "&fuu=fuu";
                    console.log('out url:' + expectedUrlToWrap);

                    var weixin = proxyquire('../server/weixin', {
                        './payurl': {payUrl: payurl}
                    });
                    var wrapRedirectURLByOath2WayStub = sinon.stub();
                    wrapRedirectURLByOath2WayStub.withArgs(expectedUrlToWrap).returns(expectedUrl);
                    weixin.weixin.wrapRedirectURLByOath2Way = wrapRedirectURLByOath2WayStub;

                    expect(weixin.sendPayUrl(info)).eql(expectedUrl);
                });
            });

            describe('处理请求', function () {
                function showPage(controller, page) {
                    var resRenderSpy = sinon.spy();
                    var resStub = {render: resRenderSpy}
                    controller(null, resStub);
                    expect(resRenderSpy).calledWith(page);
                }

                it('显示首页', function () {
                    var controller = require('../server/wechat/manjusri').home;
                    showPage(controller, 'wechat/index');
                });

                describe('日行一善', function () {
                    it('显示页面', function () {
                        var controller = require('../server/wechat/accvirtue').dailyVirtue;
                        showPage(controller, 'wechat/dailyVirtue');
                    });

                    describe('日行一善的执行', function () {
                        var reqStub, resStub;
                        var statusSpy, resEndSpy;
                        var controller;

                        function checkResponseStatusCodeAndMessage(code, message) {
                            expect(statusSpy).calledWith(code).calledOnce;
                            expect(resStub.statusMessage).eql(message);
                        }

                        function checkResponseEnded() {
                            expect(resEndSpy).calledOnce;
                        }

                        beforeEach(function () {
                            reqStub = {
                                body: {}
                            };
                            statusSpy = sinon.spy();
                            resEndSpy = sinon.spy();
                            resStub = {
                                status: statusSpy,
                                end: resEndSpy
                            }
                            controller = require('../server/wechat/accvirtue').doAction;
                        });

                        it('如果请求体中未包含金额，则应响应客户端错400', function () {
                            controller(reqStub, resStub);
                            checkResponseStatusCodeAndMessage(400, 'amount is undefined');
                            checkResponseEnded();
                        });

                        it('金额不合法，则应响应客户端错400', function () {
                            reqStub.body.amount = '-24.58';
                            controller(reqStub, resStub);
                            checkResponseStatusCodeAndMessage(400, 'amount is invalid');
                            checkResponseEnded();
                        });

                        it('金额以分为单位', function () {
                            reqStub.body.amount = '24.584';
                            var trans = {
                                transName: '日行一善',
                                amount: 2458,
                                target: undefined
                            };
                            var payurl = 'http://payurl';
                            var weixinStub = sinon.stub();
                            weixinStub.withArgs(trans).returns(payurl);
                            var stubs = {
                                '../weixin': {sendPayUrl: weixinStub}
                            };
                            controller = proxyquire('../server/wechat/accvirtue', stubs);
                            controller.doAction(reqStub, resStub);
                            expect(resEndSpy).calledWith(payurl);
                        });

                        it('获得回向', function () {
                            var target = 'this is target for virtue....';
                            reqStub.body.amount = '24.585';
                            reqStub.body.target = target;
                            var trans = {
                                transName: '日行一善',
                                amount: 2459,
                                target: target
                            };
                            var payurl = 'http://payurl';
                            var weixinStub = sinon.stub();
                            weixinStub.withArgs(trans).returns(payurl);
                            var stubs = {
                                '../weixin': {sendPayUrl: weixinStub}
                            };
                            controller = proxyquire('../server/wechat/accvirtue', stubs);
                            controller.doAction(reqStub, resStub);
                            expect(resEndSpy).calledWith(payurl);
                        });
                    })
                })
            });
        })
    })
})
