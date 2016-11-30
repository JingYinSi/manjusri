/**
 * Created by sony on 2016/9/26.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    XML = require('pixl-xml'),
    js2xmlparser = require('js2xmlparser'),
    proxyquire = require('proxyquire');

function createPromiseStub(withArgs, resolves, err) {
    var stub = sinon.stub();
    var mid;
    var promise = stub.returnsPromise();

    if (withArgs && withArgs.length > 0) {
        mid = stub.withArgs.apply(stub, withArgs);
        promise = mid.returnsPromise();
    } else promise = stub.returnsPromise();

    if (err) {
        promise.rejects(err);
        return stub;
    }
    if (resolves) {
        promise.resolves.apply(promise, resolves);
    }
    return stub;
}

describe('静音寺业务系统', function () {
    var stubs, err;
    beforeEach(function () {
        stubs = {}
        err = new Error();
    });

    describe('业务', function (done) {
        var virtuesInDb, partsInDb, usersInDb;
        var ObjectID;

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
                if (err) {
                    errored = true;
                    return callback(err);
                }
                result.push(data);
                ++finished;
                if (finished === docs.length && !errored) {
                    return callback(null, result);
                }
            }

            docs.forEach(function (item) {
                new model(item).save(done);
            });
        }

        function initDB(insertDocs, callback) {
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
                partsInDb = docs;
                insertDocs(UserModel, usersData, function (err, docs) {
                    if (err) return callback(err);
                    usersInDb = docs;
                    var virtuesData = [
                        {
                            "lord": usersInDb[0].id,
                            "subject": partsInDb[0].id,
                            "amount": 20,
                            "state": "payed",
                        }
                    ];
                    insertDocs(VirtueModel, virtuesData, function (err, docs) {
                        if (err) return callback(err);
                        virtuesInDb = docs;
                        return callback();
                    });
                });
            });
        }

        beforeEach(function (done) {
            ObjectID = require('mongodb').ObjectID;
            mongoose.Promise = global.Promise;
            if (!mongoose.connection.db)
                mongoose.connect(dbURI);

            initDB(insertDocsInSequential, done);
            //initDB(insertDocsInParallel, done);
        });

        afterEach(function (done) {
            clearDB(done);
        });

        xdescribe('模型', function () {
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

            describe('法物', function () {
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

                it('更新法物数量', function () {
                    var part = partsInDb[2];
                    var num = part.num;
                    var sold = part.sold;
                    part.updateNum(3);
                    expect(part.num).eql(num - 3);
                    expect(part.sold).eql(sold + 3);
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

            describe('法物', function () {
                describe('更新法物数量', function () {
                    it('访问法物时失败', function () {
                        var partId = 12234556;
                        var partFindByIdStub = createPromiseStub([partId], null, err);
                        stubs['../wechat/models/part'] = {findById: partFindByIdStub}

                        var parts = proxyquire('../server/modules/parts', stubs);
                        return parts.updatePartNum(partId, 23)
                            .catch(function (error) {
                                expect(error).eql(err);
                            });
                    });

                    it('未找到指定法物', function () {
                        var partId = 12234556;
                        var partFindByIdStub = createPromiseStub([partId], [null]);
                        stubs['../wechat/models/part'] = {findById: partFindByIdStub}

                        var parts = proxyquire('../server/modules/parts', stubs);
                        return parts.updatePartNum(partId, 23)
                            .catch(function (error) {
                                expect(error instanceof Error).true;
                                expect(error.message).eql('The part ' + partId + ' is not found');
                            });
                    });

                    it('保存法物时失败', function () {
                        var partId = 12234556;
                        var partUpdateSpy = sinon.spy();

                        var partSaveStub = createPromiseStub([], null, err);
                        var part = {
                            updateNum: partUpdateSpy,
                            save: partSaveStub
                        };

                        var partFindByIdStub = createPromiseStub([partId], [part]);
                        stubs['../wechat/models/part'] = {findById: partFindByIdStub};

                        var parts = proxyquire('../server/modules/parts', stubs);
                        return parts.updatePartNum(partId, 23)
                            .catch(function (error) {
                                expect(partUpdateSpy).calledWith(23);
                                expect(partSaveStub).calledOnce;
                                expect(error).eql(err);
                            });
                    });

                    it('成功', function () {
                        var partId = 12234556;
                        var partUpdateSpy = sinon.spy();

                        var partSaveStub = createPromiseStub([], []);
                        var part = {
                            updateNum: partUpdateSpy,
                            save: partSaveStub
                        };

                        var partFindByIdStub = createPromiseStub([partId], [part]);
                        stubs['../wechat/models/part'] = {findById: partFindByIdStub};

                        var parts = proxyquire('../server/modules/parts', stubs);
                        return parts.updatePartNum(partId, 23)
                            .then(function () {
                                expect(partUpdateSpy).calledWith(23);
                                expect(partSaveStub).calledOnce;
                            });
                    });
                });
            });

            describe('功德', function () {
                describe('预置捐助交易', function () {
                    var virtues, subject, timestamp, timestampStub;

                    beforeEach(function () {
                        virtues = require('../server/modules/virtues');
                        timestamp = Date.now();
                        timestampStub = sinon.stub();
                        timestampStub.returns(timestamp);
                        virtues.getTimestamp = timestampStub;

                        subject = partsInDb[0].id;

                    });

                    it('未给出捐助对象subject', function () {
                        return virtues.place()
                            .then(function () {
                                    assert.fail(0, 1, 'Exception not thrown');
                                },
                                function (err) {
                                    expect(err.errors['subject'].message)
                                        .eql('Path `subject` is required.');
                                });
                    });

                    it('捐助对象subject不存在', function () {
                        subject = new ObjectID();
                        return virtues.place(subject, 23.12)
                            .then(function () {
                                    assert.fail(0, 1, 'Exception not thrown');
                                },
                                function (err) {
                                    expect(err.errors['subject'].message)
                                        .eql('subject ' + subject + ' 不存在');
                                });
                    });

                    it('数量必须为正整数', function () {
                        return virtues.place(subject, 23.34, {num: 2.1})
                            .then(function () {
                                    assert.fail(0, 1, 'Exception not thrown');
                                },
                                function (err) {
                                    expect(err.errors['num'].message)
                                        .eql('num必须为正整数');
                                });
                    });

                    it('数量必须为正整数', function () {
                        return virtues.place(subject, 23.34, {num: -34})
                            .then(function () {
                                    assert.fail(0, 1, 'Exception not thrown');
                                },
                                function (err) {
                                    expect(err.errors['num'].message)
                                        .eql('num必须为正整数');
                                });
                    });

                    it('价格为金额，最多两位小数', function () {
                        return virtues.place(subject, 462.2, {price: 23.345})
                            .then(function () {
                                    assert.fail(0, 1, 'Exception not thrown');
                                },
                                function (err) {
                                    expect(err.errors['price'].message)
                                        .eql('price为金额最多两位小数且大于零');
                                });
                    });

                    it('价格为金额应大于零', function () {
                        return virtues.place(subject, 462.2, {price: -23.34})
                            .then(function () {
                                    assert.fail(0, 1, 'Exception not thrown');
                                },
                                function (err) {
                                    expect(err.errors['price'].message)
                                        .eql('price为金额最多两位小数且大于零');
                                });
                    });

                    it('金额必须给出', function () {
                        return virtues.place(subject)
                            .then(function () {
                                    assert.fail(0, 1, 'Exception not thrown');
                                },
                                function (err) {
                                    expect(err.errors['amount'].message)
                                        .eql('Path `amount` is required.');
                                });
                    });

                    it('金额最多两位小数', function () {
                        return virtues.place(subject, 23.345)
                            .then(function () {
                                    assert.fail(0, 1, 'Exception not thrown');
                                },
                                function (err) {
                                    expect(err.errors['amount'].message)
                                        .eql('amount为金额最多两位小数且大于零');
                                });
                    });

                    it('金额应大于零', function () {
                        return virtues.place(subject, -23.34)
                            .then(function () {
                                    assert.fail(0, 1, 'Exception not thrown');
                                },
                                function (err) {
                                    expect(err.errors['amount'].message)
                                        .eql('amount为金额最多两位小数且大于零');
                                });
                    });

                    it('正确预置捐助交易', function () {
                        return virtues.place(subject, 462.2, {price: 23.11, num: 20}, 'this is any giving')
                            .then(function (doc) {
                                expect(doc.subject.toString()).eql(subject);
                                expect(doc.num).eql(20);
                                expect(doc.price).eql(23.11);
                                expect(doc.amount).eql(462.2);
                                expect(doc.giving).eql('this is any giving');
                                expect(doc.timestamp.valueOf()).eql(timestamp);
                                expect(doc.state).eql('new');
                            });
                    });
                });

                it('列出最近的捐助交易', function () {
                    var virtues = require('../server/modules/virtues');
                    return virtues.listLastVirtues(1)
                        .then(function (list) {
                            expect(list.length).eql(1);
                            var doc = list[0];
                            expect(doc.date).eql(virtuesInDb[0].timestamp);
                            expect(doc.num).eql(virtuesInDb[0].num);
                            expect(doc.amount).eql(virtuesInDb[0].amount);
                            expect(doc.lord).eql(usersInDb[0].name);
                            expect(doc.subject).eql(partsInDb[0].name);
                        });
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
                var trans;
                var id, obj, virtueModelPlaceStub;
                var updatePartNumStub;
                var self, payUrl, getLinkStub;
                var wrapedPayUrl, wrapRedirectURLByOath2WayStub;
                var prepay;

                beforeEach(function () {
                    prepay = virtues.prepay;
                    trans = {
                        subject: 12345667,
                        amount: 45.67,
                        giving: 'this is giving'
                    }
                    expectedVirtuePlaceParams = [
                        trans.subject,
                        trans.amount,
                        null,
                        trans.giving
                    ];

                    id = 1235566;
                    obj = {
                        id: id,
                        others: 'others'
                    }
                    virtueModelPlaceStub = createPromiseStub(expectedVirtuePlaceParams, [obj]);
                    stubs['../modules/virtues'] = {place: virtueModelPlaceStub};

                    self = 'self/link';
                    payUrl = 'weixin/pay';
                    getLinkStub = sinon.stub();
                    getLinkStub.withArgs('virtue', {id: id}).returns(self);
                    getLinkStub.withArgs('pay', {virtue: id}).returns(payUrl);
                    stubs['../rests'] = {getLink: getLinkStub};

                    wrapedPayUrl = 'wraped/url';
                    wrapRedirectURLByOath2WayStub = sinon.stub();
                    wrapRedirectURLByOath2WayStub.withArgs(encodeURIComponent(payUrl)).returns(wrapedPayUrl);
                    stubs['../weixin'] = {weixin: {wrapRedirectURLByOath2Way: wrapRedirectURLByOath2WayStub}};
                });

                it('预置捐助交易失败', function (done) {
                    virtueModelPlaceStub = createPromiseStub(expectedVirtuePlaceParams, null, err);
                    stubs['../modules/virtues'] = {place: virtueModelPlaceStub};

                    prepay = proxyquire('../server/rest/virtues', stubs).prepay;
                    app.post('/prepay', prepay);

                    request
                        .post('/prepay')
                        .send(trans)
                        .expect(500, err, done);
                });

                it('成功, 捐助交易中不包含数量和价格', function (done) {
                    prepay = proxyquire('../server/rest/virtues', stubs).prepay;
                    app.post('/prepay', prepay);

                    request
                        .post('/prepay')
                        .send(trans)
                        .expect('link', '<' + self + '>; rel="self", <' + wrapedPayUrl + '>; rel="pay"')
                        .expect('Location', self)
                        .expect(201, obj, done);
                });

                it('更新法物数量失败', function (done) {
                    var num = '2';
                    var price = '25.67';
                    trans.num = num;
                    trans.price = price;

                    expectedVirtuePlaceParams[2] = {price: price, num: num};
                    virtueModelPlaceStub = createPromiseStub(expectedVirtuePlaceParams, [obj]);
                    stubs['../modules/virtues'] = {place: virtueModelPlaceStub};

                    var updatePartNumStub = createPromiseStub([trans.subject, num * 1], null, err);
                    stubs['../modules/parts'] = {updatePartNum: updatePartNumStub};

                    prepay = proxyquire('../server/rest/virtues', stubs).prepay;
                    app.post('/prepay', prepay);

                    request
                        .post('/prepay')
                        .send(trans)
                        .expect(500, err, done);
                });

                it('成功, 捐助交易中包含数量和价格', function (done) {
                    var num = '2';
                    var price = '25.67';
                    trans.num = num;
                    trans.price = price;

                    expectedVirtuePlaceParams[2] = {price: price, num: num};
                    virtueModelPlaceStub = createPromiseStub(expectedVirtuePlaceParams, [obj]);
                    stubs['../modules/virtues'] = {place: virtueModelPlaceStub};

                    var updatePartNumStub = createPromiseStub([trans.subject, 2], []);
                    stubs['../modules/parts'] = {updatePartNum: updatePartNumStub};

                    prepay = proxyquire('../server/rest/virtues', stubs).prepay;
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
        describe('Http请求', function () {
            var opt, request, data;
            var simpleGetStub;
            beforeEach(function () {
                opt = {
                    url: 'http://example.com',
                    method: 'POST',
                    body: 'this is the POST body',
                    headers: {
                        'user-agent': 'my cool app'
                    },
                    json: true
                }
                data = {foo: 'foo'};
                simpleGetStub = sinon.stub();
            });

            it('请求失败', function () {
                simpleGetStub.withArgs(opt).callsArgWith(1, err);
                stubs['simple-get'] = {concat: simpleGetStub};
                request = proxyquire('../modules/httprequest', stubs);
                return request.concat(opt)
                    .then(function (responseData) {
                        expect(err).to.be.undefined;
                    }, function (error) {
                        expect(error).eql(err);
                    })
            });

            it('请求成功', function () {
                simpleGetStub.withArgs(opt).callsArgWith(1, null, null, data);
                stubs['simple-get'] = {concat: simpleGetStub};
                request = proxyquire('../modules/httprequest', stubs);
                return request.concat(opt)
                    .then(function (responseData) {
                        expect(responseData).eql(data);
                    }, function (error) {
                        expect(err).to.be.null;
                    });
            });
        });
    });

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
        var endSpy, statusSpy, renderSpy, resSendSpy;
        beforeEach(function () {
            statusSpy = sinon.spy();
            endSpy = sinon.spy();
            renderSpy = sinon.spy();
            resSendSpy = sinon.spy();
            resStub = {
                status: statusSpy,
                end: endSpy,
                render: renderSpy,
                send: resSendSpy
            }
            wrapper = require('../modules/responsewrap')(resStub);
        });

        it('设置响应状态码并立刻将响应发送至客户端', function () {
            var code = 400;
            wrapper.setError(code);
            expect(statusSpy).calledWith(400).calledOnce;
            expect(endSpy).calledOnce;
        });

        it('设置响应状态码及相关原因，并立刻将响应发送至客户端', function () {
            var code = 400;
            var msg = 'the reason of this status';
            wrapper.setError(code, msg);
            expect(statusSpy).calledWith(400).calledOnce;
            expect(resStub.statusMessage).eql(msg);
            expect(resSendSpy).calledWith(msg).calledOnce;
        });

        it('设置响应状态码及相关原因，响应体中包含详细错误', function () {
            var code = 400;
            var err = new Error();
            var msg = 'the reason of this status';
            wrapper.setError(code, msg, err);
            expect(statusSpy).calledWith(400).calledOnce;
            expect(resStub.statusMessage).eql(msg);
            expect(resSendSpy).calledWith(err).calledOnce;
        });

        it('渲染客户端', function () {
            var page = '../view/p1';
            var data = {foo: 'foo data'};

            wrapper.render(page, data);
            expect(renderSpy).calledWith('../view/p1', {foo: 'foo data'}).calledOnce;
        });
    });


    describe('微信公众号', function () {
        describe('微信接口配置', function () {
            var config;
            var appid, appsecret, mch_id, mch_key;
            var apiBaseURL, oauth2BaseURL;

            beforeEach(function () {
                appid = 'appid';
                appsecret = 'appsecret';
                mch_id = 'eveqveqfvfvff';
                mch_key = 'womendoushiwutaishanjingyinsidet';
                apiBaseURL = 'apiBaseURL';
                oauth2BaseURL = 'oauth2BaseURL';

                config = require('../modules/weixinconfig')({
                    apiBaseURL: apiBaseURL,
                    appId: appid,
                    appSecret: appsecret,
                    oauth2BaseURL: oauth2BaseURL,
                    mchId: mch_id,
                    mchKey: mch_key
                });
            });

            it('获得accesstoken的Url', function () {
                var url = 'https://api.weixin.qq.com/cgi-bin/token?' +
                    'grant_type=client_credential&appid=' + appid + '&secret=' + appsecret;
                expect(config.getUrlToGetAccessToken()).eql(url);
            });

            it('获得openid的Url', function () {
                var code = '1234534566';
                var url = apiBaseURL + "access_token?appid="
                    + appid + "&secret=" + appsecret
                    + "&code=" + code + "&grant_type=authorization_code";
                expect(config.getUrlToGetOpenId(code)).eql(url);
            })
        });

        describe('微信接口Promise实现', function () {
            var weixinConfig, weixinFactory, weixin;


            beforeEach(function () {
                weixinConfig = {}
            });

            describe('获取AccessToken', function () {
                var requestStub, urlToGetAccessToken;

                beforeEach(function () {
                    urlToGetAccessToken = 'https:/api.weixin.qq.com/cgi-bin/...';
                    requestStub = sinon.stub();
                    requestStub.returns(urlToGetAccessToken);
                    weixinConfig.getUrlToGetAccessToken = requestStub;
                });

                it('微信接口访问失败', function () {
                    var requestStub = createPromiseStub([{url: urlToGetAccessToken, json: true}], null, err);
                    stubs['./httprequest'] = {concat: requestStub}

                    weixinFactory = proxyquire('../modules/weixinfactory', stubs);
                    weixin = weixinFactory(weixinConfig);
                    return weixin.getAccessToken()
                        .then(function () {
                            throw 'get accesstoken should rejected!';
                        }, function (error) {
                            expect(error).eql(err);
                        });
                });

                //TODO:实现accesstoken的缓存
                it('正确获得', function () {
                    var accessToken = '233546457357';
                    var data = {access_token: accessToken};

                    var requestStub = createPromiseStub([{url: urlToGetAccessToken, json: true}], [data]);
                    stubs['./httprequest'] = {concat: requestStub}

                    weixinFactory = proxyquire('../modules/weixinfactory', stubs);
                    weixin = weixinFactory(weixinConfig);
                    return weixin.getAccessToken()
                        .then(function (token) {
                            expect(token).eql(accessToken);
                        }, function (error) {
                            expect(err).to.be.null;
                        });
                })
            });

            describe('获得openId', function () {
                var requestStub, urlToGetOpenId;
                var code;

                beforeEach(function () {
                    code = '1234';
                    urlToGetOpenId = 'https:/api.weixin.qq.com/cgi-bin/getopenid...';
                    var getUrlToGetOpenIdStub = sinon.stub();
                    getUrlToGetOpenIdStub.withArgs(code).returns(urlToGetOpenId);
                    weixinConfig.getUrlToGetOpenId = getUrlToGetOpenIdStub;
                });

                it('微信接口访问失败', function () {
                    var requestStub = createPromiseStub([{url: urlToGetOpenId, json: true}], null, err);
                    stubs['./httprequest'] = {concat: requestStub}

                    weixinFactory = proxyquire('../modules/weixinfactory', stubs);
                    weixin = weixinFactory(weixinConfig);
                    return weixin.getOpenId(code)
                        .then(function () {
                            throw 'get openid should rejected!';
                        }, function (error) {
                            expect(error).eql(err);
                        });
                });

                it("获得OpenId", function () {
                    var expectedOpenId = '123456789033';
                    var dataFromWeixin = {openid: expectedOpenId};

                    var requestStub = createPromiseStub([{url: urlToGetOpenId, json: true}], [dataFromWeixin]);
                    stubs['./httprequest'] = {concat: requestStub}

                    weixinFactory = proxyquire('../modules/weixinfactory', stubs);
                    weixin = weixinFactory(weixinConfig);
                    return weixin.getOpenId(code)
                        .then(function (data) {
                            expect(data).eql(expectedOpenId);
                        }, function (error) {
                            throw 'get openid should be resolve';
                        });
                });
            })

            describe('获得特定OpenId的用户信息', function () {
                var openid, accesstoken, getAccessTokenStub;
                var requestStub;

                beforeEach(function () {
                    openid = '123457744333';
                    accesstoken = 'cehqdcqeceqeg4h66n';

                    urlToGetUserInfo = 'https:/api.weixin.qq.com/cgi-bin/getuserinfo...';
                    var getUrlToGetOpenIdStub = sinon.stub();
                    getUrlToGetOpenIdStub.withArgs(accesstoken, openid).returns(urlToGetUserInfo);
                    weixinConfig.getUrlToGetOpenId = getUrlToGetOpenIdStub;
                })

                it('获取accesstoken失败', function () {
                    getAccessTokenStub = createPromiseStub(null, null, err);
                    weixinFactory = proxyquire('../modules/weixinfactory', stubs);
                    weixin = weixinFactory(weixinConfig);
                    weixin.getAccessToken = getAccessTokenStub;

                    return weixin.getUserInfoByOpenId(openid)
                        .then(function () {
                            throw 'should not goes here';
                        }, function (error) {
                            expect(error).eql(err);
                        });
                });

                it('获取用户信息失败', function () {
                    getAccessTokenStub = createPromiseStub(null, [accesstoken]);
                    requestStub = createPromiseStub([{url: urlToGetUserInfo, json: true}], [dataFromWeixin]);
                    stubs['./httprequest'] = {concat: requestStub}

                    weixinFactory = proxyquire('../modules/weixinfactory', stubs);
                    weixin = weixinFactory(weixinConfig);
                    weixin.getAccessToken = getAccessTokenStub;

                    return weixin.getUserInfoByOpenId(openid)
                        .then(function () {
                            throw 'should not goes here';
                        }, function (error) {
                            expect(error).eql(err);
                        });
                });

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
                    var simpleGetStub = createPromiseStub([expectedUrlToGetUserInfo], [userInfo]);
                    stubs['../modules/httprequest'] = {concat: simpleGetStub}

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

                    var simpleGetStub = createPromiseStub([{url: expectedUrlToGetAccessToken, json: true}], [data]);
                    stubs['../modules/httprequest'] = {concat: simpleGetStub}

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
                    var simpleGetStub = createPromiseStub([expectedUrlToGetUserInfo], [userInfo]);
                    stubs['../modules/httprequest'] = {concat: simpleGetStub}

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
                var dataFromWeixin = {openid: expectedOpenId};

                var concatStub = createPromiseStub([{url: url, json: true}], [dataFromWeixin]);
                stubs['../modules/httprequest'] = {concat: concatStub}

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

            describe('资源注册', function () {
                it('getLink', function () {
                    var linkage = require('../server/rests');
                    expect(linkage.getLink("virtue", {id: 234567})).eql("/jingyin/rest/virtues/234567");
                    expect(linkage.getLink("pay", {virtue: 234567}))
                        .eql("http://jingyintemple.top/jingyin/manjusri/pay/confirm?virtue=234567");
                });
            });

            describe('处理请求', function () {
                var reqStub, resStub;
                var statusSpy, resEndSpy, resSendSyp, resRenderSpy;
                var controller;

                function checkResponseStatusCodeAndMessage(code, message, err) {
                    expect(statusSpy).calledWith(code).calledOnce;
                    if (message)
                        expect(resStub.statusMessage).eql(message);
                    if (err)
                        expect(resSendSyp).calledWith(err);
                }

                beforeEach(function () {
                    statusSpy = sinon.spy();
                    resSendSyp = sinon.spy();
                    resEndSpy = sinon.spy();
                    resRenderSpy = sinon.spy();

                    reqStub = {
                        query: {},
                        params: {}
                    };
                    resStub = {
                        status: statusSpy,
                        render: resRenderSpy,
                        send: resSendSyp,
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

                describe('显示首页', function () {
                    var virtuesList, virtueListStub;
                    var times, countStub;

                    beforeEach(function () {
                        virtuesList = [{}, {}];
                        virtueListStub = createPromiseStub([30], [virtuesList]);
                        stubs['../modules/virtues'] = {listLastVirtues: virtueListStub};

                        times = 10;
                        countStub = createPromiseStub([{state: 'payed'}], [times]);
                        stubs['./models/virtue'] = {count: countStub};
                    });

                    it('未能列出最近的捐助交易', function () {
                        virtueListStub = createPromiseStub([30], null, err);
                        stubs['../modules/virtues'] = {listLastVirtues: virtueListStub};

                        controller = proxyquire('../server/wechat/manjusri', stubs).home;
                        return controller(reqStub, resStub)
                            .then(function () {
                                checkResponseStatusCodeAndMessage(500, null, err);
                            });
                    });

                    it('未能列出捐助交易总数', function () {
                        countStub = createPromiseStub([{state: 'payed'}], null, err);
                        stubs['./models/virtue'] = {count: countStub};

                        controller = proxyquire('../server/wechat/manjusri', stubs).home;
                        return controller(reqStub, resStub)
                            .then(function () {
                                checkResponseStatusCodeAndMessage(500, null, err);
                            });
                    });

                    it('正确显示', function () {
                        controller = proxyquire('../server/wechat/manjusri', stubs).home;
                        return controller(reqStub, resStub)
                            .then(function () {
                                expect(resRenderSpy).calledWith('wechat/index', {
                                    virtues: virtuesList,
                                    times: 10,
                                    title: '首页'
                                });
                            });
                    });
                });

                describe('显示建寺', function () {
                    var partFindStub, partslist;

                    beforeEach(function () {
                        partslist = [{foo: 'fffff'}, {}];
                        partFindStub = createPromiseStub([{type: 'part', onSale: true}], [partslist]);
                        stubs['./models/part'] = {find: partFindStub};
                    });

                    it('未能列出当前上架的法物', function () {
                        partFindStub = createPromiseStub([{type: 'part', onSale: true}], null, err);
                        stubs['./models/part'] = {find: partFindStub};
                        controller = proxyquire('../server/wechat/manjusri', stubs).jiansi;

                        return controller(reqStub, resStub)
                            .then(function () {
                                checkResponseStatusCodeAndMessage(500, null, err);
                            });
                    });

                    it('正确显示', function () {
                        controller = proxyquire('../server/wechat/manjusri', stubs).jiansi;

                        return controller(reqStub, resStub)
                            .then(function () {
                                expect(resRenderSpy).calledWith('wechat/jiansi', {
                                    title: '建寺',
                                    parts: partslist
                                });
                            });
                    });
                });

                describe('日行一善', function () {
                    var virtuesList, virtueListStub;
                    var times, countStub;
                    var part, findOneStub;

                    beforeEach(function () {
                        virtuesList = [{}, {}];
                        virtueListStub = createPromiseStub([30], [virtuesList]);
                        stubs['../modules/virtues'] = {listLastVirtues: virtueListStub};

                        times = 10;
                        countStub = createPromiseStub([{state: 'payed'}], [times]);
                        stubs['./models/virtue'] = {count: countStub};

                        part = new Object();
                        findOneStub = createPromiseStub([{type: 'daily', onSale: true}], [part]);
                        stubs['./models/part'] = {findOne: findOneStub};
                    });

                    it('未能列出最近的捐助交易', function () {
                        virtueListStub = createPromiseStub([30], null, err);
                        stubs['../modules/virtues'] = {listLastVirtues: virtueListStub};

                        controller = proxyquire('../server/wechat/manjusri', stubs).dailyVirtue;
                        return controller(reqStub, resStub)
                            .then(function () {
                                checkResponseStatusCodeAndMessage(500, null, err);
                            });
                    });

                    it('未能列出捐助交易总数', function () {
                        countStub = createPromiseStub([{state: 'payed'}], null, err);
                        stubs['./models/virtue'] = {count: countStub};

                        controller = proxyquire('../server/wechat/manjusri', stubs).dailyVirtue;
                        return controller(reqStub, resStub)
                            .then(function () {
                                checkResponseStatusCodeAndMessage(500, null, err);
                            });
                    });

                    it('访问日行一善的相关信息失败', function () {
                        findOneStub = createPromiseStub([{type: 'daily', onSale: true}], null, err);
                        stubs['./models/part'] = {findOne: findOneStub};

                        controller = proxyquire('../server/wechat/manjusri', stubs).dailyVirtue;
                        return controller(reqStub, resStub)
                            .then(function () {
                                checkResponseStatusCodeAndMessage(500, null, err);
                            });
                    });

                    it('未能获得日行一善的相关信息', function () {
                        findOneStub = createPromiseStub([{type: 'daily', onSale: true}], [null]);
                        stubs['./models/part'] = {findOne: findOneStub};

                        controller = proxyquire('../server/wechat/manjusri', stubs).dailyVirtue;
                        return controller(reqStub, resStub)
                            .then(function () {
                                checkResponseStatusCodeAndMessage(500, '日行一善相关信息未建立');
                            });
                    });

                    it('正确显示', function () {
                        controller = proxyquire('../server/wechat/manjusri', stubs).dailyVirtue;
                        return controller(reqStub, resStub)
                            .then(function () {
                                expect(resRenderSpy).calledWith('wechat/dailyVirtue', {
                                    virtues: virtuesList,
                                    times: 10,
                                    part: part,
                                    title: '建寺-日行一善'
                                });
                            });
                    });
                });

                describe('随喜', function () {
                    var part, findOneStub;

                    beforeEach(function () {
                        part = new Object();
                        findOneStub = createPromiseStub([{type: 'suixi', onSale: true}], [part]);
                        stubs['./models/part'] = {findOne: findOneStub};
                    });

                    it('访问随喜的相关信息失败', function () {
                        findOneStub = createPromiseStub([{type: 'suixi', onSale: true}], null, err);
                        stubs['./models/part'] = {findOne: findOneStub};

                        controller = proxyquire('../server/wechat/manjusri', stubs).suixi;
                        return controller(reqStub, resStub)
                            .then(function () {
                                checkResponseStatusCodeAndMessage(500, null, err);
                            });
                    });

                    it('未能获得随喜的相关信息', function () {
                        findOneStub = createPromiseStub([{type: 'suixi', onSale: true}], [null]);
                        stubs['./models/part'] = {findOne: findOneStub};

                        controller = proxyquire('../server/wechat/manjusri', stubs).suixi;
                        return controller(reqStub, resStub)
                            .then(function () {
                                checkResponseStatusCodeAndMessage(500, '随喜相关信息未建立');
                            });
                    });

                    it('正确显示', function () {
                        controller = proxyquire('../server/wechat/manjusri', stubs).suixi;
                        return controller(reqStub, resStub)
                            .then(function () {
                                expect(resRenderSpy).calledWith('wechat/suixi', {
                                    part: part,
                                    title: '建寺-随喜所有建庙功德'
                                });
                            });
                    });
                });

                describe('认捐法物', function () {
                    var partId, part, partFindByIdStub;

                    beforeEach(function () {
                        partId = 12345;
                        part = {name: 'foo'}

                        reqStub.params.partId = partId;
                        partFindByIdStub = createPromiseStub([partId], [part]);
                        stubs['./models/part'] = {findById: partFindByIdStub};
                    });

                    it('访问法物的相关信息失败', function () {
                        var partId = 12345;
                        reqStub.params.partId = partId;
                        var partFindByIdStub = createPromiseStub([partId], null, err);
                        stubs['./models/part'] = {findById: partFindByIdStub};

                        controller = proxyquire('../server/wechat/manjusri', stubs).trans;
                        return controller(reqStub, resStub)
                            .then(function () {
                                checkResponseStatusCodeAndMessage(500, null, err);
                            });
                    });

                    it('指定法物不存在', function () {
                        var partId = 12345;
                        reqStub.params.partId = partId;
                        var partFindByIdStub = createPromiseStub([partId], [null]);
                        stubs['./models/part'] = {findById: partFindByIdStub};

                        controller = proxyquire('../server/wechat/manjusri', stubs).trans;
                        return controller(reqStub, resStub)
                            .then(function () {
                                checkResponseStatusCodeAndMessage(404, 'part ' + partId.toString() + ' is not found');
                            });
                    });

                    it('正确显示', function () {
                        var partId = 12345;
                        var part = {name: 'foo'}

                        reqStub.params.partId = partId;
                        var partFindByIdStub = createPromiseStub([partId], [part]);
                        stubs['./models/part'] = {findById: partFindByIdStub};

                        controller = proxyquire('../server/wechat/manjusri', stubs).trans;
                        return controller(reqStub, resStub)
                            .then(function () {
                                expect(resRenderSpy).calledWith('wechat/trans', {
                                    title: '建寺-' + part.name,
                                    part: part
                                });
                            });
                    });
                });

                describe('微信支付', function () {
                    var code;
                    beforeEach(function () {
                        code = '12345678';
                        reqStub.query.code = code;
                    })

                    it('请求中未包含code的查询变量', function () {
                        delete reqStub.query.code;
                        controller = proxyquire('../server/wechat/payment', stubs).pay;
                        controller(reqStub, resStub);
                        checkResponseStatusCodeAndMessage(400);
                    })
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


