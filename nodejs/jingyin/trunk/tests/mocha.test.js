/**
 * Created by sony on 2016/9/26.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
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
            var ObjectID;
            beforeEach(function (done) {
                ObjectID = require('mongodb').ObjectID;
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
                        subject: new ObjectID(),
                        amount: 45.8
                    };
                });

                describe('创建交易', function () {
                    it('金额应大于零', function (done) {
                        trans.amount = 0;
                        Virtue.place(trans, function (err, virtue) {
                            expect(err.errors['amount'].message).to.be.eql('金额应大于零');
                            expect(virtue).not.exist;
                            done();
                        });
                    });

                    it('预置一笔捐助', function (done) {
                        Virtue.place(trans, function (err, virtue) {
                            expect(err).be.null;
                            expect(virtue.amount).to.be.equal(trans.amount);
                            expect(virtue.state).to.be.equal('new');
                            expect(virtue.timestamp).to.be.a('date');
                            done();
                        })
                    });
                });

                describe('捐助支付', function (done) {
                    var transId, userId, paymentNo;
                    beforeEach(function (done) {
                        Virtue.place(trans, function (err, virtue) {
                            expect(err).not.exist;
                            transId = virtue.id;
                            userId = new ObjectID();
                            paymentNo = 'csdwevrevwervv';
                            done();
                        })
                    });

                    it('支付成功', function (done) {
                        Virtue.pay(transId, userId, paymentNo, function (err, virtue) {
                            expect(err).not.exist;
                            expect(virtue.id).eql(transId);
                            expect(virtue.lord).eql(userId);
                            expect(virtue.paymentNo).eql(paymentNo);
                            expect(virtue.state).eql('payed');
                            done();
                        })
                    })
                });

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

                describe('微信用户注册', function (done) {
                    var openid, weixinUser;
                    var name, img, city, province;
                    beforeEach(function (done) {
                        openid = 'wgefwevwhebhvirvheverv';
                        name = "Band";
                        img = "http://wx.qlogo.cn/mmopen/g3MonUZtNH84eavHiaiceqxibJxCfHe/0";
                        city = "广州";
                        province = "广东";

                        weixinUser = {
                            "subscribe": 1,
                            "openid": openid,
                            "nickname": name,
                            "sex": 1,
                            "language": "zh_CN",
                            "city": city,
                            "province": province,
                            "country": "中国",
                            "headimgurl": img,
                            "subscribe_time": 1382694957,
                            "unionid": " o6_bmasdasdsad6_2sgVt7hMZOPfL",
                            "remark": "",
                            "groupid": 0,
                            "tagid_list": [128, 2]
                        }
                        done();
                    });

                    it('新用户注册', function (done) {
                        User.registerWeixinUser(weixinUser, function (err, user) {
                            expect(err).be.null;
                            expect(user._id).exist;
                            expect(user.name).eql(name);
                            expect(user.img).eql(img);
                            expect(user.openid).eql(openid);
                            expect(user.subscribe).eql(1382694957);
                            expect(user.city).eql(city);
                            expect(user.province).eql(province);
                            expect(user.sex).eql(1);
                            done();
                        });
                    });

                    it('用户已注册，则更新该用户信息', function (done) {
                        User.registerWeixinUser(weixinUser, function (err, user) {
                            weixinUser.nickname = 'foo';
                            weixinUser.headimgurl = 'foo img';
                            weixinUser.subscribe_time = 2334;
                            weixinUser.city = 'nj';
                            weixinUser.province = 'js';
                            weixinUser.sex = 2;

                            User.registerWeixinUser(weixinUser, function (err, updatedUser) {
                                expect(err).be.null;
                                expect(user._id).eql(updatedUser._id);
                                expect(updatedUser.name).eql('foo');
                                expect(updatedUser.img).eql('foo img');
                                expect(user.openid).eql(updatedUser.openid);
                                expect(updatedUser.subscribe).eql(2334);
                                expect(updatedUser.city).eql('nj');
                                expect(updatedUser.province).eql('js');
                                expect(updatedUser.sex).eql(2);
                                done();
                            });
                        });
                    });

                    it('用户已注册，但用户信息未变', function (done) {
                        User.registerWeixinUser(weixinUser, function (err, user) {
                            var userInfo = {
                                openid: weixinUser.openid
                            }
                            User.registerWeixinUser(userInfo, function (err, updatedUser) {
                                expect(err).be.null;
                                expect(user._doc).eql(updatedUser._doc);
                                done();
                            });
                        });
                    });
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

        describe('业务对象', function () {
            function insertDocsInSequential(model, docs, callback) {
                var result = [];

                function iterate(index) {
                    if (index === docs.length) return callback(null, result);
                    new model(docs[index]).save(function (err, data) {
                        if (err) return callback(err, result);
                        result.push(data);
                        iterate(index + 1);
                    });
                }

                iterate(0);
            }

            function insertDocsInParallel(model, docs, callback) {
                var result = [];
                var finished = 0, errored = false;

                function done(err, data) {
                    if(err){
                        errored = true;
                        return callback(err);
                    }
                    result.push(data);
                    ++finished;
                    if(finished === docs.length && !errored){
                        return callback(null, result);
                    }
                }

                docs.forEach(function (item) {
                    new model(item).save(done);
                });
            }

            function initDB(insertDocs, callback) {
                var virtues, parts, users;

                var PartModel = require('../server/wechat/models/part');
                var UserModel = require('../server/wechat/models/user');
                var VirtueModel = require('../server/wechat/models/virtue');

                var partsData = [
                    {
                        "type": "daily",
                        "name": "每日一善",
                        "img": "/images/product_banner2.jpg",
                        "onSale": true,
                    },
                    {
                        "type": "suixi",
                        "name": "随喜",
                        "onSale": true,
                    },
                    {
                        "type": "part",
                        "name": "万尊文殊菩萨像小",
                        "img": "/images/product2.jpg",
                        "price": 1000,
                        "num": 50,
                        "onSale": true,
                        "sold": 10,
                    }
                ];
                var usersData = [
                    {
                        "name": "陈立新",
                        "openid": "o0ghywcfW_2Dp4oN-7NADengZAVM",
                    },
                    {
                        "name": "Susan孙英",
                        "openid": "o0ghywYninpxeXtUPk-lTFx2cK9Q",
                    }
                ];

                insertDocs(PartModel, partsData, function (err, docs) {
                    if (err) return callback(err);
                    parts = docs;
                    insertDocs(UserModel, usersData, function (err, docs) {
                        if (err) return callback(err);
                        users = docs;
                        var virtuesData = [
                            {
                                "lord": users[0].id,
                                "subject": parts[0].id,
                                "amount": 20,
                                "state": "payed",
                            }
                        ];
                        insertDocs(VirtueModel, virtuesData, function (err, docs) {
                            if (err) return callback(err);
                            virtues = docs;
                            return callback();
                        });
                    });
                });
            }

            describe('功德', function () {
                beforeEach(function (done) {
                    //initDB(insertDocsInSequential, done);
                    initDB(insertDocsInParallel, done);
                });

                afterEach(function (done) {
                    clearDB(done);
                    //done();
                });

                it('列出最近的捐助交易', function (done) {
                    var virtues = require('../server/modules/virtues');
                    virtues.listLastVirtues(1, function (err, list) {
                        expect(list.length).eql(1);
                        var doc = list[0];
                        done();
                    });
                });
            });
        });

        describe("Restful服务", function () {
            var request, express, app, bodyParser;
            var requestAgent;

            before(function () {
                bodyParser = require('body-parser');
                requestAgent = require('supertest');
                express = require('express');

            });

            describe('virtues', function () {
                var virtues;
                beforeEach(function () {
                    app = express();
                    request = requestAgent(app);
                    app.use(bodyParser.json());
                    virtues = require('../server/rest/virtues');
                });

                describe("预置交易单", function () {
                    var amount, subject, trans;
                    var prepay;

                    beforeEach(function () {
                        prepay = virtues.prepay;

                        subject = 'foo subject';
                        amount = 45.67;
                        trans = {
                            subject: subject,
                            amount: amount
                        }
                    });

                    it('未包含交易对象subject，则应响应客户端错400', function (done) {
                        delete trans.subject;
                        app.post('/prepay', prepay);
                        request.post('/prepay')
                            .send(trans)
                            .expect(400, 'subject is not defined', done);
                    });

                    it('未包含金额，则应响应客户端错400', function (done) {
                        delete trans.amount;
                        app.post('/prepay', prepay);
                        request.post('/prepay')
                            .send(trans)
                            .expect(400, 'amount is undefined', done);
                    });

                    it('金额不合法，则应响应客户端错400', function (done) {
                        trans.amount = '-24.58';
                        app.post('/prepay', prepay);
                        request.post('/prepay')
                            .send(trans)
                            .expect(400, 'amount is invalid', done);
                    });

                    it('成功', function (done) {
                        var id = 1235566;
                        var obj = {
                            id: id,
                            others: 'others'
                        }
                        var virtueModelPlaceStub = sinon.stub();
                        virtueModelPlaceStub.withArgs(trans).callsArgWith(1, null, obj);
                        stubs['../wechat/models/virtue'] = {place: virtueModelPlaceStub};

                        var self = 'self/link';
                        var payUrl = 'weixin/pay';
                        var getLinkStub = sinon.stub();
                        getLinkStub.withArgs('virtue', {id: id}).returns(self);
                        getLinkStub.withArgs('pay', {virtue: id}).returns(payUrl);
                        stubs['../rests'] = {getLink: getLinkStub};

                        var wrapedPayUrl = 'wraped/url';
                        var wrapRedirectURLByOath2WayStub = sinon.stub();
                        wrapRedirectURLByOath2WayStub.withArgs(encodeURIComponent(payUrl)).returns(wrapedPayUrl);
                        stubs['../weixin'] = {weixin: {wrapRedirectURLByOath2Way: wrapRedirectURLByOath2WayStub}};

                        virtues = proxyquire('../server/rest/virtues', stubs);
                        prepay = virtues.prepay;
                        app.post('/prepay', prepay);

                        request
                            .post('/prepay')
                            .send(trans)
                            //TODO: 根据资源定义由framework中间件实现
                            //.expect('Content-Type', 'application/json; charset=utf-8')
                            //.expect('link', '<http://jingyintemple.top/rest/profile>; rel="profile", <http://jingyintemple.top/rest/profile>; rel="self"')
                            //------------------------------------------------------------------------

                            .expect('link', '<' + self + '>; rel="self", <' + wrapedPayUrl + '>; rel="pay"')
                            .expect('Location', self)
                            .expect(201, obj, done);
                    });
                });
            });
        });

        describe('技术', function () {
            describe('utils', function () {
                it('直接从GET请求中获取JSON对象', function () {
                    var data = {
                        foo: 'foo',
                        fee: 'fee'
                    }
                    var url = 'http://something';
                    var buffer = new Buffer(JSON.stringify(data));
                    var simpleGetStub = sinon.stub();
                    simpleGetStub.withArgs(url).callsArgWith(1, null, null, buffer);
                    stubs['simple-get'] = {concat: simpleGetStub}

                    utils = proxyquire('../modules/utils', stubs);
                    var callbackIsCalled = false;
                    utils.simpleGetJson(url, function (err, obj) {
                        callbackIsCalled = true;
                        expect(err).to.be.null;
                        expect(obj).eql(data);
                    });
                    expect(callbackIsCalled).to.be.true;

                })
            });

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
                var weixinModule, weixinConfig;
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
                    weixinModule = require('../modules/weixin');
                    weixin = weixinModule(weixinConfig);
                });

                describe('获得AccessToken', function () {
                    //TODO:实现accesstoken的缓存
                    it('正确获得', function () {
                        var accessToken = '233546457357';
                        var data = {access_token: accessToken};
                        var expectedUrlToGetAccessToken = 'https://api.weixin.qq.com/cgi-bin/token?' +
                            'grant_type=client_credential&appid=' + appid + '&secret=' + appsecret;
                        var simpleGetStub = sinon.stub();
                        simpleGetStub.withArgs(expectedUrlToGetAccessToken).callsArgWith(1, null, data);
                        stubs['../modules/utils'] = {simpleGetJson: simpleGetStub}

                        weixin = proxyquire('../modules/weixin', stubs)(weixinConfig);
                        var callbackIsCalled = false;
                        weixin.getAccessToken(function (err, token) {
                            callbackIsCalled = true;
                            expect(err).to.be.null;
                            expect(token).eql(accessToken);
                        });
                        expect(callbackIsCalled).to.be.true;
                    })
                });

                describe('获得特定OpenId的用户信息', function () {
                    it('获得用户信息', function () {
                        var openId = 'bdhbdhfvdfb';
                        var accessToken = '233546457357';
                        var getAccessTokenStub = sinon.stub();
                        getAccessTokenStub.callsArgWith(0, null, accessToken);

                        var userInfo = {
                            foo: "foo"
                        };
                        var expectedUrlToGetUserInfo = 'https://api.weixin.qq.com/cgi-bin/user/info?' +
                            'access_token=' + accessToken + '&openid=' + openId + '&lang=zh_CN';
                        var simpleGetStub = sinon.stub();
                        simpleGetStub.withArgs(expectedUrlToGetUserInfo).callsArgWith(1, null, userInfo);
                        stubs['../modules/utils'] = {simpleGetJson: simpleGetStub}

                        weixin = proxyquire('../modules/weixin', stubs)(weixinConfig);
                        weixin.getAccessToken = getAccessTokenStub;

                        var callbackIsCalled = false;
                        weixin.getUserInfoByOpenId(openId, function (err, info) {
                            callbackIsCalled = true;
                            expect(err).to.be.null;
                            expect(info).eql(userInfo);
                        });
                        expect(callbackIsCalled).to.be.true;
                    })
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
                        attach: "jingyin",
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
                    var paymentXml, payment, paymentJsonToSign, signMD5Stub;
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
                        payment = XML.parse(paymentXml);
                        paymentJsonToSign = Object.assign({}, payment);
                        delete paymentJsonToSign.sign;

                        signMD5Stub = sinon.stub();
                        signMD5Stub.withArgs(paymentJsonToSign).returns('4C59A329EE4E7D35BE7FC840C599F6FE');
                        weixin.signMD5 = signMD5Stub;
                    });

                    it('验证无误', function () {
                        var obj = weixin.parsePaymentNotification(payment);
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

                    xit('配置路由', function () {
                        var manjusri = require('../server/wechat/manjusri'),
                            payment = require('../server/wechat/payment'),
                            part = require('../server/rest/virtues'),
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

                        routeStub.withArgs('/jingyin/rest/virtues/prepay').returns(handlerStub);

                        getSpy.withArgs(manjusri.dailyVirtue).returns(handlerStub);
                        getSpy.withArgs(manjusri.index).returns(handlerStub);
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
                });

                describe('资源注册', function () {
                    it('getLink', function () {
                        var linkage = require('../server/rests');
                        expect(linkage.getLink("virtue", {id: 234567})).eql("/jingyin/rest/virtues/234567");
                        expect(linkage.getLink("pay", {virtue: 234567}))
                            .eql("http://jingyintemple.top/jingyin/manjusri/pay/confirm?virtue=234567");
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

                    describe('业务系统', function () {
                        it("法物管理页面", function () {
                            controller = require('../biz/part');
                        })
                    });
                });

                describe('处理请求', function () {
                    var stubs;
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
                        stubs = {};
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
                        var openid, msg, msgReplySpy;

                        beforeEach(function () {
                            controller = require('../server/wechat/wechat').dealWithMessage;
                            openid = '1234567890';
                            msg = {
                                FromUserName: openid,
                                MsgType: 'event',
                                Event: 'subscribe'
                            };
                            reqStub.weixin = msg;

                            msgReplySpy = sinon.spy();
                            resStub.reply = msgReplySpy;
                        });

                        it('对于无需处理的消息，直接应答空串', function () {
                            msg.Event = 'foo';
                            controller(reqStub, resStub);
                            expect(msgReplySpy).calledWith('');
                        });

                        describe('响应关注消息', function () {
                            it('应答欢迎信息', function () {
                                var user = {name: 'foo'}
                                var registerUserStub = sinon.stub();
                                registerUserStub.withArgs(openid).callsArgWith(1, null, user);
                                stubs['../modules/users'] = {
                                    register: registerUserStub
                                };

                                var answer = {foo: 'foo'};
                                var welcomeStub = sinon.stub();
                                welcomeStub.withArgs(user).callsArgWith(1, null, answer);
                                stubs['../modules/welcome'] = welcomeStub;

                                controller = proxyquire('../server/wechat/wechat', stubs).dealWithMessage;
                                controller(reqStub, resStub);
                                expect(msgReplySpy).calledWith(answer);
                            });
                        });
                    });

                    it('显示首页', function () {
                        var virtuesList = [{}, {}];
                        var virtueListStub = sinon.stub();
                        virtueListStub.withArgs(30).callsArgWith(1, null, virtuesList);
                        stubs['../modules/virtues'] = {listLastVirtues: virtueListStub};

                        var times = 10;
                        var countStub = sinon.stub();
                        countStub.withArgs({state: 'payed'}).callsArgWith(1, null, times);
                        stubs['./models/virtue'] = {count: countStub};

                        var controller = proxyquire('../server/wechat/manjusri', stubs).home;
                        showPage(controller, 'wechat/index', {
                            virtues: virtuesList,
                            times: 10,
                            title: '首页'
                        });
                    });

                    it('显示建寺', function () {
                        var partslist = [{foo: 'fffff'}, {}];
                        var partFindStub = sinon.stub();
                        partFindStub.withArgs({type: 'part', onSale: true}).callsArgWith(1, null, partslist);
                        stubs['./models/part'] = {find: partFindStub};
                        var controller = proxyquire('../server/wechat/manjusri', stubs).jiansi;

                        showPage(controller, 'wechat/jiansi', {
                            title: '建寺',
                            parts: partslist
                        });
                    });

                    describe('日行一善', function () {
                        it('显示页面', function () {
                            var virtuesList = [{}, {}];
                            var virtueListStub = sinon.stub();
                            virtueListStub.withArgs(30).callsArgWith(1, null, virtuesList);
                            stubs['../modules/virtues'] = {listLastVirtues: virtueListStub};

                            var times = 10;
                            var countStub = sinon.stub();
                            countStub.withArgs({state: 'payed'}).callsArgWith(1, null, times);
                            stubs['./models/virtue'] = {count: countStub};

                            var part = {foo: 'part'};
                            var findOneStub = sinon.stub();
                            findOneStub.withArgs({type: 'daily', onSale: true}).callsArgWith(1, null, part);
                            stubs['./models/part'] = {findOne: findOneStub};

                            var controller = proxyquire('../server/wechat/manjusri', stubs).dailyVirtue;
                            showPage(controller, 'wechat/dailyVirtue', {
                                virtues: virtuesList,
                                times: 10,
                                part: part,
                                title: '建寺-日行一善'
                            });
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
            });

            describe('服务端业务逻辑', function () {
                describe('欢迎图文信息', function () {
                    it('可以产生这样的欢迎图文信息', function () {
                        var welcomeMsg = [
                            {
                                title: '静音文殊禅林',
                                description: '描述静音文殊禅林',
                                picurl: 'http://jingyintemple.top/images/banner.jpg',
                                url: 'http://jingyintemple.top/jingyin/manjusri/index'
                            },
                            {
                                title: '欢迎您关注静音文殊禅林-建寺',
                                description: '描述-建寺',
                                picurl: 'http://jingyintemple.top/images/jiansi.jpg',
                                url: 'http://jingyintemple.top/jingyin/manjusri/jiansi'
                            },
                            {
                                title: '欢迎您关注静音文殊禅林-每日一善',
                                description: '描述-每日一善',
                                picurl: 'http://jingyintemple.top/images/jiansi.jpg',
                                url: 'http://jingyintemple.top/jingyin/manjusri/jiansi'
                            },
                            {
                                title: '欢迎您关注静音文殊禅林-随喜功德',
                                description: '描述-随喜功德',
                                picurl: 'http://jingyintemple.top/images/jiansi.jpg',
                                url: 'http://jingyintemple.top/jingyin/manjusri/jiansi'
                            }
                        ];
                        var welcome = require('../server/modules/welcome');
                        welcome(null, function (err, msg) {
                            expect(err).to.be.null;
                            expect(msg).eql(welcomeMsg);
                        });
                    });
                });

                describe('用户注册', function () {
                    it('成功注册', function () {
                        var openId = 'o6_bmjrPTlm6_2sgVt7hMZOPfL2M';
                        var userInfoToRegister = {
                            "subscribe": 1,
                            "openid": openId,
                            "nickname": "Band",
                            "sex": 1,
                            "language": "zh_CN",
                            "city": "广州",
                            "province": "广东",
                            "country": "中国",
                            "headimgurl": "http://wx.qlogo.cn/mmopen/g3MonUZtNHkdmzicIlibx6iaFqAc56vxLSUfpb6n5WKSYVY0ChQKkiaJSgQ1dZuTOgvLLrhJbERQQ4eMsv84eavHiaiceqxibJxCfHe/0",
                            "subscribe_time": 1382694957,
                            "unionid": " o6_bmasdasdsad6_2sgVt7hMZOPfL",
                            "remark": "",
                            "groupid": 0
                        }
                        var expectedUser = {name: 'foo'}
                        var getUserInfoStub = sinon.stub();
                        getUserInfoStub.withArgs(openId).callsArgWith(1, null, userInfoToRegister);
                        stubs['../weixin'] = {
                            weixin: {getUserInfoByOpenId: getUserInfoStub}
                        };

                        var registerUserStub = sinon.stub();
                        registerUserStub.withArgs(userInfoToRegister).callsArgWith(1, null, expectedUser);
                        stubs['../wechat/models/user'] = {registerWeixinUser: registerUserStub};

                        var users = proxyquire('../server/modules/users', stubs);
                        users.register(openId, function (err, user) {
                            expect(err).to.be.null;
                            expect(user).eql(expectedUser);
                        });

                    });
                });
            });
        });
    });
});