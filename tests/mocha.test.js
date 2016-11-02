/**
 * Created by sony on 2016/9/26.
 */
var mongoose = require('mongoose'),
    XML = require('pixl-xml'),
    js2xmlparser = require('js2xmlparser'),
    proxyquire = require('proxyquire');

describe('静音寺业务系统', function () {
    var stubs;
    beforeEach(function () {
        stubs = {}
    });

    describe('业务', function () {
        describe('模型', function () {
            beforeEach(function (done) {
                mongoose.Promise = global.Promise;
                if (mongoose.connection.db) return done();
                mongoose.connect(dbURI, done);
            });

            afterEach(function (done) {
                clearDB(done);
            });

            describe('捐助交易', function () {
                var Virtue;
                var trans;
                beforeEach(function () {
                    Virtue = require('../server/wechat/models/virtue');
                    trans = {
                        trader: 'foo trader',
                        amount: 45.8,
                        details: {
                            subject: 'fee subject'
                        }
                    };
                });

                describe('创建交易', function () {
                    it('未定义交易者trader', function (done) {
                        delete trans.trader;
                        Virtue.placeVirtue(trans, function (err, virtue) {
                            expect(err.errors['trader'].message).to.be.eql('Path `trader` is required.');
                            expect(virtue).not.exist;
                            done();
                        });
                    });

                    it('未定义交易类型subject', function (done) {
                        delete trans.details.subject;
                        Virtue.placeVirtue(trans, function (err, virtue) {
                            expect(err.errors['details.subject'].message).to.be.eql('Path `details.subject` is required.');
                            expect(virtue).not.exist;
                            done();
                        });
                    });

                    it('金额应大于零', function (done) {
                        trans.amount = 0;
                        Virtue.placeVirtue(trans, function (err, virtue) {
                            expect(err.errors['amount'].message).to.be.eql('金额应大于零');
                            expect(virtue).not.exist;
                            done();
                        });
                    });

                    it('创建一笔捐助', function (done) {
                        var details = {
                            subject: "foo",
                            num: 10,
                            price: 10.34
                        }
                        trans.details = details;
                        trans.amount = 103.4;
                        trans.giving = 'any hope for';
                        Virtue.placeVirtue(trans, function (err, virtue) {
                            expect(err).be.null;
                            expect(virtue.trader).eql(trans.trader);
                            expect(virtue._doc.details).deep.equal(details);
                            expect(virtue.amount).to.be.equal(trans.amount);
                            expect(virtue.giving).to.be.equal(trans.giving);
                            expect(virtue.state).to.be.equal('new');
                            expect(virtue.timestamp).to.be.a('date');
                            done();
                        })
                    });
                });


                describe('捐助支付', function (done) {
                    var transId;
                    beforeEach(function (done) {
                        Virtue.placeVirtue(trans, function (err, virtue) {
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

            describe('法物目录', function () {
                var Part;
                var partIdTheAlreadyInDb;
                beforeEach(function (done) {
                    Part = require('../server/wechat/models/part');
                    var model = new Part({
                        name: 'part name',
                        desc: 'description of the part',
                        img: '/images/aaa.img',
                        price: 150,
                        num: 5,
                        sold: 1,
                        onSale: true
                    });
                    model.save(function (err, part) {
                        expect(err).not.exist;
                        partIdTheAlreadyInDb = part._id;
                        done();
                    });

                });

                it('创建法物', function (done) {
                    var doc = {
                        name: 'part name',
                        desc: 'description of the part',
                        img: '/images/aaa.img',
                        price: 150,
                        num: 5,
                        sold: 1,
                        onSale: true
                    };
                    Part.create(doc, function (err, part) {
                        expect(err).be.null;
                        expect(part._id).exist;
                        expect(part.seq).eql(doc.seq);
                        expect(part.name).eql(doc.name);
                        expect(part.desc).eql(doc.desc);
                        expect(part.img).eql(doc.img);
                        expect(part.price).eql(doc.price);
                        expect(part.num).eql(doc.num);
                        expect(part.sold).eql(doc.sold);
                        expect(part.onSale).eql(doc.onSale);
                        done();
                    })
                });

                it('列出法物', function (done) {
                    Part.findById(partIdTheAlreadyInDb, function (err, part) {
                        expect(err).not.exist;
                        expect(part._id).eql(partIdTheAlreadyInDb);
                        expect(part.price).eql(150);
                        done();
                    });
                })
            });

            describe('用户', function () {
                var User;
                beforeEach(function (done) {
                    User = require('../server/wechat/models/user');
                    done();
                });

                it('创建用户', function (done) {
                    var doc = {
                        name: 'user name',
                        img: '/images/aaa.img',
                        openid: 'ABSFHHFdjdfjfdfvd',
                        phone: '1234567',
                        addr: 'xxxxxxxxx',
                        watching: true
                    };
                    User.create(doc, function (err, user) {
                        expect(err).be.null;
                        expect(user._id).exist;
                        expect(user.name).eql(doc.name);
                        expect(user.img).eql(doc.img);
                        expect(user.openId).eql(doc.openId);
                        expect(user.phone).eql(doc.phone);
                        expect(user.addr).eql(doc.addr);
                        expect(user.watching).eql(doc.watching);
                        done();
                    })
                });
            });
        });
    });


    describe('技术', function () {
        describe('Response Wrapper', function () {
            var wrapper, resStub;
            var endSpy, statusSpy, renderSpy;
            beforeEach(function () {
                statusSpy = sinon.spy();
                endSpy = sinon.spy();
                renderSpy = sinon.spy();
                resStub = {
                    status: statusSpy,
                    end: endSpy,
                    render: renderSpy
                }
                wrapper = require('../modules/responsewrap')(resStub);
            });

            it('设置响应状态码并立刻将响应发送至客户端', function () {
                var code = 400;
                wrapper.setStatus(code);
                expect(statusSpy).calledWith(400).calledOnce;
                expect(endSpy).calledOnce;
            });

            it('设置响应状态码及相关原因，并立刻将响应发送至客户端', function () {
                var code = 400;
                var msg = 'the reason of this status';
                wrapper.setStatus(code, msg);
                expect(statusSpy).calledWith(400).calledOnce;
                expect(resStub.statusMessage).eql(msg);
                expect(endSpy).calledOnce;
            });

            it('渲染客户端', function () {
                var page = '../view/p1';
                var data = {foo: 'foo data'};

                wrapper.render(page, data);
                expect(renderSpy).calledWith('../view/p1', {foo: 'foo data'}).calledOnce;
            });
        })
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
                expectedPay.paySign = paySign;
                expectedPay.prepay_id = prePayId;

                var callback = sinon.spy();
                weixin.prePay(openId, transId, transName, amount, callback);
                expect(callback).calledWith(null, expectedPay);
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
                        suixi = require('../server/wechat/suixi'),
                        wechat = require('../server/wechat/wechat'),
                        payment = require('../server/wechat/payment'),
                        part = require('../server/rest/part'),
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
                    routeStub.withArgs('/jingyin/manjusri/jiansi').returns(handlerStub);
                    routeStub.withArgs('/jingyin/manjusri/dailyvirtue').returns(handlerStub);
                    routeStub.withArgs('/jingyin/manjusri/accuvirtue').returns(handlerStub);
                    routeStub.withArgs('/jingyin/manjusri/suixi').returns(handlerStub);
                    routeStub.withArgs('/jingyin/manjusri/trans/:partId').returns(handlerStub);
                    routeStub.withArgs('/jingyin/manjusri/pay/confirm').returns(handlerStub);
                    routeStub.withArgs('/jingyin/manjusri/pay/notify').returns(handlerStub);

                    routeStub.withArgs('/jingyin/biz/parts/index').returns(handlerStub);

                    getSpy.withArgs(wechat.hook).returns(handlerStub);
                    getSpy.withArgs(accuvirtue.dailyVirtue).returns(handlerStub);
                    getSpy.withArgs(accuvirtue.index).returns(handlerStub);
                    getSpy.withArgs(suixi.index).returns(handlerStub);
                    getSpy.withArgs(suixi.trans).returns(handlerStub);
                    getSpy.withArgs(payment.index).returns(handlerStub);
                    getSpy.withArgs(payment.result).returns(handlerStub);

                    getSpy.withArgs(part.index).returns(handlerStub);

                    routes({route: routeStub});

                    //expect(postSpy).calledWith(wechat.receive);
                    expect(postSpy).calledWith(accuvirtue.action);
                    expect(postSpy).calledWith(payment.payNotify);
                });

                it('向客户端发送可重定向的支付请求的1', function () {
                    var payurl = 'http://payurl';
                    var expectedUrl = 'http://expected/url';
                    var info = {
                        foo: 'foo',
                        fee: '可能有中文',
                        fuu: 'fuu',
                    };
                    var expectedUrlToWrap = encodeURIComponent(payurl + "?foo=foo&fee=可能有中文&fuu=fuu");
                    var weixin = proxyquire('../server/weixin', {
                        './payurl': {payUrl: payurl}
                    });
                    var wrapRedirectURLByOath2WayStub = sinon.stub();
                    wrapRedirectURLByOath2WayStub.withArgs(expectedUrlToWrap).returns(expectedUrl);
                    weixin.weixin.wrapRedirectURLByOath2Way = wrapRedirectURLByOath2WayStub;

                    expect(weixin.sendPayUrl(info)).eql(expectedUrl);
                });
            });

            describe("控制器", function () {
                var stubs, controller;
                var reqStub, resStub;
                var resEndSpy, resStatusSpy, resRenderSpy;
                var resWrapStub;

                beforeEach(function () {
                    resStatusSpy = sinon.spy();
                    resRenderSpy = sinon.spy();
                    resWrapStub = sinon.stub();
                    resWrapStub.withArgs(resStub).returns({
                        setStatus: resStatusSpy,
                        render: resRenderSpy
                    });
                    stubs = {
                        '../../modules/responsewrap': resWrapStub
                    };
                });

                describe("Restful服务", function () {

                });

                describe('业务系统', function () {
                    it("法物管理页面", function () {
                        controller = require('../biz/part');
                    })
                });
            });

            describe('处理请求', function () {
                var reqStub, resStub;
                var statusSpy, resEndSpy;
                var controller;

                function showPage(controller, page, data) {
                    var resRenderSpy = sinon.spy();
                    resStub.render = resRenderSpy;
                    controller(reqStub, resStub);
                    if (data)
                        expect(resRenderSpy).calledWith(page, data);
                    else
                        expect(resRenderSpy).calledWith(page);
                }

                function checkResponseStatusCodeAndMessage(code, message) {
                    expect(statusSpy).calledWith(code).calledOnce;
                    if (message)
                        expect(resStub.statusMessage).eql(message);
                }

                function checkResponseEnded() {
                    expect(resEndSpy).calledOnce;
                }

                beforeEach(function () {
                    statusSpy = sinon.spy();
                    resEndSpy = sinon.spy();

                    reqStub = {
                        query: {},
                        params: {}
                    };
                    resStub = {
                        status: statusSpy,
                        end: resEndSpy
                    }
                });

                describe('响应微信消息', function () {
                    beforeEach(function () {
                        controller = require('../server/wechat/wechat');
                    });

                    describe('响应关注消息', function () {
                        var msg = {anyfoo: 'foo'};
                        var handler = sinon.stub();
                        handler.withArgs(msg).callsArgWith(1, null, '');
                        /*stubs['../weixin'] = {
                            weixin: {
                                attention: handler
                            }
                        };
                        controller = proxyquire('../server/wechat/wechat', stubs).receive;*/

                    });
                });

                it('显示首页', function () {
                    var controller = require('../server/wechat/manjusri').home;
                    showPage(controller, 'wechat/index');
                });

                it('显示建寺', function () {
                    var partslist = {foo: 'fffff'};
                    var partFindStub = sinon.stub();
                    partFindStub.withArgs({onSale: true}).callsArgWith(1, null, partslist);
                    var controller = proxyquire('../server/wechat/manjusri', {
                        './models/part': {find: partFindStub}
                    }).jiansi;
                    showPage(controller, 'wechat/jiansi', {
                        title: '建寺',
                        parts: partslist
                    });
                });

                describe('日行一善', function () {
                    it('显示页面', function () {
                        var controller = require('../server/wechat/accvirtue').dailyVirtue;
                        showPage(controller, 'wechat/dailyVirtue');
                    });
                });

                describe('认捐法物', function () {
                    it('显示页面', function () {
                        var partId = 12345;
                        var part = {name: 'foo'}

                        reqStub.params.partId = partId;
                        var partFindByIdStub = sinon.stub();
                        partFindByIdStub.withArgs(partId).callsArgWith(1, null, part);
                        var controller = proxyquire('../server/wechat/suixi', {
                            './models/part': {findById: partFindByIdStub}
                        }).trans;
                        showPage(controller, 'wechat/trans', {
                            title: '建寺-' + part.name,
                            part: part
                        });
                    });
                });

                describe('执行交易', function () {
                    var subject, amount;
                    beforeEach(function () {
                        subject = 'foo subject';
                        amount = 45.34
                        reqStub = {
                            body: {
                                subject: subject,
                                amount: amount
                            }
                        };
                        controller = require('../server/wechat/accvirtue').action;
                    });

                    it('如果请求体中未包含交易类型subject，则应响应客户端错400', function () {
                        delete reqStub.body.subject;
                        controller(reqStub, resStub);
                        checkResponseStatusCodeAndMessage(400, 'subject is not defined');
                        checkResponseEnded();
                    });

                    it('如果请求体中未包含金额，则应响应客户端错400', function () {
                        delete reqStub.body.amount;
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

                    describe('向客户端返回用OAuth2包装的支付服务的URL', function () {
                        var payurl, weixinStub;

                        beforeEach(function () {
                            payurl = 'http://payurl';
                            weixinStub = sinon.stub();
                            stubs = {
                                '../weixin': {sendPayUrl: weixinStub}
                            };
                        });

                        it('金额精确到分', function () {
                            reqStub.body.amount = '24.584';
                            var trans = {
                                subject: subject,
                                amount: 24.58,
                            };
                            weixinStub.withArgs(trans).returns(payurl);
                            controller = proxyquire('../server/wechat/accvirtue', stubs);
                            controller.action(reqStub, resStub);
                            expect(resEndSpy).calledWith(payurl);
                        });

                        describe('获得其它信息', function () {
                            it('获得名称', function () {
                                var name = 'subject name';
                                reqStub.body.name = name;
                                var trans = {
                                    subject: subject,
                                    name: name,
                                    amount: amount,
                                };
                                weixinStub.withArgs(trans).returns(payurl);
                                controller = proxyquire('../server/wechat/accvirtue', stubs);
                                controller.action(reqStub, resStub);
                                expect(resEndSpy).calledWith(payurl);
                            });

                            it('获得价格', function () {
                                var price = 45.3;
                                reqStub.body.price = price;
                                var trans = {
                                    subject: subject,
                                    price: price,
                                    amount: amount,
                                };
                                weixinStub.withArgs(trans).returns(payurl);
                                controller = proxyquire('../server/wechat/accvirtue', stubs);
                                controller.action(reqStub, resStub);
                                expect(resEndSpy).calledWith(payurl);
                            });

                            it('获得数量', function () {
                                var num = 45;
                                reqStub.body.num = num;
                                var trans = {
                                    subject: subject,
                                    num: num,
                                    amount: amount,
                                };
                                weixinStub.withArgs(trans).returns(payurl);
                                controller = proxyquire('../server/wechat/accvirtue', stubs);
                                controller.action(reqStub, resStub);
                                expect(resEndSpy).calledWith(payurl);
                            });

                            it('获得回向', function () {
                                var giving = 'this is giving of virtue....';
                                reqStub.body.giving = giving;

                                var trans = {
                                    subject: subject,
                                    amount: amount,
                                    giving: giving
                                };
                                weixinStub.withArgs(trans).returns(payurl);
                                controller = proxyquire('../server/wechat/accvirtue', stubs);
                                controller.action(reqStub, resStub);
                                expect(resEndSpy).calledWith(payurl);
                            });

                        });

                    });
                });

                describe('微信支付', function () {
                    var setResStatusSpy, resRenderSpy, resWrapStub;

                    beforeEach(function () {
                        setResStatusSpy = sinon.spy();
                        resRenderSpy = sinon.spy();
                        resWrapStub = sinon.stub();
                        resWrapStub.withArgs(resStub).returns({
                            setStatus: setResStatusSpy,
                            render: resRenderSpy
                        });
                        stubs['../../modules/responsewrap'] = resWrapStub;

                        controller = proxyquire('../server/wechat/payment', stubs).index;
                    });

                    it('请求查询参数中未包含code，则响应客户端错400', function () {
                        reqStub.query = {};
                        controller(reqStub, resStub);
                        expect(setResStatusSpy).calledWith(400).calledOnce;
                    });

                    describe('获取OpenId', function () {
                        var code;
                        var getOpenIdStub;

                        beforeEach(function () {
                            code = "foocode";
                            reqStub.query.code = code;
                            getOpenIdStub = sinon.stub();
                            stubs['../weixin'] = {
                                weixin: {
                                    getOpenId: getOpenIdStub
                                }
                            };
                        });

                        it('获取OpenId失败，响应客户端错400', function () {
                            var err = new Error();

                            getOpenIdStub.withArgs(code).callsArgWith(1, err);
                            controller = proxyquire('../server/wechat/payment', stubs).index;

                            controller(reqStub, resStub);
                            expect(setResStatusSpy).calledWith(400).calledOnce;
                        });

                        describe('创建交易', function () {
                            var trader, subject, amount, num, price, giving;
                            var expectedTrans;
                            var virtueStub;
                            beforeEach(function () {
                                trader = 'foo';
                                subject = 'subject';
                                amount = 23.45;
                                num = 20;
                                price = 23.78;
                                giving = 'my giving for';

                                reqStub.query.subject = subject;
                                reqStub.query.amount = amount;
                                reqStub.query.num = num;
                                reqStub.query.price = price;
                                reqStub.query.giving = giving;

                                getOpenIdStub.withArgs(code).callsArgWith(1, null, trader);
                                expectedTrans = {
                                    trader: trader,
                                    details: {
                                        subject: subject,
                                        num: num,
                                        price: price,
                                    },
                                    amount: amount,
                                    giving: giving
                                };

                                virtueStub = sinon.stub();
                                stubs['./models/virtue'] = {placeVirtue: virtueStub};

                            });

                            it('创建交易时由数据库导致失败， 响应Bad Gateway(502)错', function () {
                                var err = {};
                                virtueStub.withArgs(expectedTrans).callsArgWith(1, err);
                                controller = proxyquire('../server/wechat/payment', stubs).index;

                                controller(reqStub, resStub);
                                expect(setResStatusSpy).calledWith(502).calledOnce;
                            });

                            it('交易数据错， 响应客户端错(400)', function () {
                                var err = {errors: []};
                                virtueStub.withArgs(expectedTrans).callsArgWith(1, err);
                                controller = proxyquire('../server/wechat/payment', stubs).index;

                                controller(reqStub, resStub);
                                expect(setResStatusSpy).calledWith(400).calledOnce;
                            });

                            describe('开始支付', function () {
                                var transId, virtue, payData;
                                var prepayStub;

                                beforeEach(function () {
                                    transId = '1234567';
                                    virtue = Object.assign({}, expectedTrans);
                                    virtue._id = transId;
                                    virtueStub.withArgs(expectedTrans).callsArgWith(1, null, virtue);

                                    payData = {foo: 'any foo'};
                                    prepayStub = sinon.stub();
                                });

                                it('预置支付失败， 响应Bad Gateway(502)错', function () {
                                    var err = 'some err';
                                    prepayStub.withArgs(trader, transId, subject, amount * 100).callsArgWith(4, err);
                                    stubs['../weixin'].weixin.prePay = prepayStub;
                                    controller = proxyquire('../server/wechat/payment', stubs).index;

                                    controller(reqStub, resStub);
                                    expect(setResStatusSpy).calledWith(502).calledOnce;
                                });

                                it('开始支付', function () {
                                    prepayStub.withArgs(trader, transId, subject, amount * 100).callsArgWith(4, null, payData);
                                    stubs['../weixin'].weixin.prePay = prepayStub;
                                    controller = proxyquire('../server/wechat/payment', stubs).index;

                                    controller(reqStub, resStub);
                                    expect(resRenderSpy).calledWith('wechat/payment', payData).calledOnce;
                                });

                                it('开始支付-请求查询参数中包含名称', function () {
                                    var name = 'subject name';
                                    reqStub.query.name = name;
                                    prepayStub.withArgs(trader, transId, name, amount * 100).callsArgWith(4, null, payData);
                                    stubs['../weixin'].weixin.prePay = prepayStub;
                                    controller = proxyquire('../server/wechat/payment', stubs).index;

                                    controller(reqStub, resStub);
                                    expect(resRenderSpy).calledWith('wechat/payment', payData).calledOnce;
                                });
                            });

                        })
                    });
                });

                describe('响应微信支付结果', function () {
                    //TODO: 编写响应微信支付结果的测试用例
                })

            });
        })
    })


})
