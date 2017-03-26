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
    var dateUtils;

    beforeEach(function () {
        stubs = {}
        err = new Error('any error message');
        dateUtils = require("../modules/utils").dateUtils;
    });

    describe('业务', function (done) {
        var partsData, usersData;
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

            partsData = [
                {
                    "type": "daily",
                    "name": "每日一善",
                    "img": "/images/product_banner2.jpg",
                    "onSale": true,
                },
                {
                    "type": "suixi",
                    "name": "随喜",
                    "img": "/images/product_banner2.jpg",
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
            usersData = [
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
                            "timestamp": dateUtils.maxYestoday()
                        },
                        {
                            "lord": usersInDb[0].id,
                            "subject": partsInDb[0].id,
                            "amount": 20,
                            "state": "payed"
                        },
                        {
                            "lord": usersInDb[1].id,
                            "subject": partsInDb[0].id,
                            "amount": 20,
                            "state": "payed"
                        },
                        {
                            "lord": usersInDb[0].id,
                            "subject": partsInDb[1].id,
                            "amount": 20,
                            "state": "payed"
                        },
                        {
                            "lord": usersInDb[1].id,
                            "subject": partsInDb[1].id,
                            "amount": 50,
                            "state": 'new'
                        },
                        {
                            "lord": usersInDb[0].id,
                            "subject": partsInDb[0].id,
                            "amount": 10,
                            "state": "new"
                        },
                        {
                            "lord": usersInDb[0].id,
                            "subject": partsInDb[0].id,
                            "amount": 20,
                            "state": "payed",
                            "timestamp": dateUtils.minTomorrow()
                        },
                        {
                            "lord": usersInDb[0].id,
                            "subject": partsInDb[0].id,
                            "amount": 20,
                            "state": "payed",
                            "timestamp": new Date(2016, 5, 24)
                        },
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

            describe('用户', function () {
                var users;

                beforeEach(function () {
                    users = require('../server/modules/users');
                });

                describe('查找指定openid的用户', function () {
                    it('指定openid的用户不存在', function (done) {
                        var result;
                        users.findByOpenid('fooopenid')
                            .then(function (user) {
                                expect(user).to.be.null;
                                done();
                            })
                            .catch(function (err) {
                                done(err);
                            });
                    });
                });

                describe('用户注册', function (done) {
                    it('成功注册', function () {
                        var openId = 'o6_bmjrPTlm6_2sgVt7hMZOPfL2M';
                        var userInfo = {
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
                        var userData = {
                            name: userInfo.nickname,
                            openid: userInfo.openid,
                            img: userInfo.headimgurl,
                            city: userInfo.city,
                            province: userInfo.province,
                            sex: userInfo.sex,
                            subscribe: userInfo.subscribe_time
                        }
                        users.registerUser(userData)
                            .then(function (data) {
                                expect(data._id).not.null;
                                done();
                            })
                            .catch(function (err) {
                                done(err);
                            });
                    });
                });

                it('补充个人资料', function (done) {
                    var data = {
                        realname: "clx",
                        phone: "1234567",
                        addr: 'foo address',
                        email: "my email address"
                    };

                    users.updateProfileByOpenid(usersData[0].openid, data)
                        .then(function (user) {
                            expect(user.realname).eql(data.realname);
                            expect(user.phone).eql(data.phone);
                            expect(user.addr).eql(data.addr);
                            expect(user.email).eql(data.email);
                            done();
                        })
                        .catch(function (err) {
                            done(err);
                        });
                })
            });

            describe('功德', function () {
                var virtues;

                beforeEach(function () {
                    virtues = require('../server/modules/virtues');
                });

                describe('预置捐助交易', function () {
                    var subject, timestamp, timestampStub;

                    beforeEach(function () {
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
                                        .eql('price:[23.345], 为金额最多两位小数且大于零');
                                });
                    });

                    it('价格为金额应大于零', function () {
                        return virtues.place(subject, 462.2, {price: -23.34})
                            .then(function () {
                                    assert.fail(0, 1, 'Exception not thrown');
                                },
                                function (err) {
                                    expect(err.errors['price'].message)
                                        .eql('price:[-23.34], 为金额最多两位小数且大于零');
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
                                        .eql('amount:[23.345], 为金额最多两位小数且大于零');
                                });
                    });

                    it('金额应大于零', function () {
                        return virtues.place(subject, -23.34)
                            .then(function () {
                                    assert.fail(0, 1, 'Exception not thrown');
                                },
                                function (err) {
                                    expect(err.errors['amount'].message)
                                        .eql('amount:[-23.34], 为金额最多两位小数且大于零');
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

                describe('指定功德主的功德', function () {

                    it('当今日无daily类型的交易时，列出指定功德主的捐助交易', function () {
                        return virtues.listLordVirtues(usersInDb[0]._id, new Date(2017, 0, 15))
                            .then(function (result) {
                                expect(result).eql({
                                    daily: {
                                        thisday: {count: 0, sum: 0},
                                        thisMonth: {count: 0, sum: 0},
                                        total: {count: 4, sum: 80}
                                    },
                                    virtues: {
                                        count: 1, sum: 20,
                                        details: [
                                            {
                                                date: virtuesInDb[3].timestamp,
                                                num: virtuesInDb[3].num,
                                                amount: virtuesInDb[3].amount,
                                                img: partsInDb[1].img,
                                                subject: partsInDb[1].name

                                            }
                                        ]
                                    }
                                });
                            });
                    });

                    it('列出指定功德主的捐助交易', function () {
                        return virtues.listLordVirtues(usersInDb[0]._id)
                            .then(function (result) {
                                expect(result).eql({
                                    daily: {
                                        thisday: {count: 1, sum: 20},
                                        thisMonth: {count: 3, sum: 60},
                                        total: {count: 4, sum: 80}
                                    },
                                    virtues: {
                                        count: 1, sum: 20,
                                        details: [
                                            {
                                                date: virtuesInDb[3].timestamp,
                                                num: virtuesInDb[3].num,
                                                amount: virtuesInDb[3].amount,
                                                img: partsInDb[1].img,
                                                subject: partsInDb[1].name

                                            }
                                        ]
                                    }
                                });
                            });
                    });
                });

                describe('查询指定单号的预置捐助交易，以便支付', function () {
                    var virtueId;

                    it('指定单号未查到', function () {
                        virtueId = '583fdfcc77ce2f2b702a5449';
                        return virtues.findNewVirtueById(virtueId)
                            .then(function (doc) {
                                expect(doc).to.be.null;
                            }, function (err) {
                                throw 'should not be here';
                            });
                    });

                    it('指定单号状态不为new', function () {
                        virtueId = virtuesInDb[0].id.toString();
                        return virtues.findNewVirtueById(virtueId)
                            .then(function (doc) {
                                expect(doc).to.be.null;
                            }, function (err) {
                                throw 'should not be here';
                            });
                    });

                    it('查找成功', function () {
                        virtueId = virtuesInDb[4].id.toString();
                        return virtues.findNewVirtueById(virtueId)
                            .then(function (doc) {
                                expect(doc.state).eql('new');
                                expect(doc.subject.name).eql(partsInDb[1].name);
                            }, function (err) {
                                throw 'should not be here';
                            });
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
                //var wrapedPayUrl, wrapRedirectURLByOath2WayStub;
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

                    /*wrapedPayUrl = 'wraped/url';
                     wrapRedirectURLByOath2WayStub = sinon.stub();
                     wrapRedirectURLByOath2WayStub.withArgs(encodeURIComponent(payUrl)).returns(wrapedPayUrl);
                     stubs['../weixin'] = {weixinConfig: {wrapRedirectURLByOath2Way: wrapRedirectURLByOath2WayStub}};*/
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
                        .expect('link', '<' + self + '>; rel="self", <' + payUrl + '>; rel="pay"')
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

                        .expect('link', '<' + self + '>; rel="self", <' + payUrl + '>; rel="pay"')
                        .expect('Location', self)
                        .expect(201, obj, done);
                });
            });

            describe('捐助交易支付成功', function () {
                var virtueId, openId, payDataFromWeixin
            })
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

        describe('关于日期', function () {
            it('today', function () {
                var d = new Date();
                var thedate = d.getDate();
                expect(d.getMonth() + 1).eql(3);
                var todaystart = new Date();
                todaystart.setHours(0, 0, 0, 0);
                var todaystartend = new Date();
                todaystartend.setHours(23, 59, 59, 999);
                var thisyear, thismonth;
                thisyear = d.getFullYear();
                thismonth = d.getMonth();
                var firstDayOfThisMonth = new Date(thisyear, thismonth, 1);
                var lastDayOfThisMonth = new Date(new Date(thisyear, thismonth + 1, 1) - 1);

                var days = lastDayOfThisMonth - firstDayOfThisMonth;
            })
        });

        describe('集群', function () {
            it('cpu', function () {
                var os = require('os');
                //expect(os.cpus().length).eql(2);
            })
        })
    });

    describe('utils', function () {
        var utils;

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

        });

        describe('日期 utils', function () {

            var theDay, expected;
            beforeEach(function () {
                theDay = new Date(2017, 1, 17);
                utils = require('../modules/utils').dateUtils;
            });

            it('昨日最晚', function () {
                expected = new Date(new Date(2017, 1, 16).setHours(23, 59, 59, 999));
                expect(utils.maxYestoday(theDay)).eql(expected);
            });

            it('明日最早', function () {
                expected = new Date(new Date(2017, 1, 18).setHours(0, 0, 0, 0));
                var actual = utils.minTomorrow(theDay);
                expect(actual).eql(expected);
            });

            it('今日最早', function () {
                expect(utils.minToday(theDay)).eql(theDay);
            });

            it('今日最晚', function () {
                expected = new Date(theDay.setHours(23, 59, 59, 999));
                expect(utils.maxToday(theDay)).eql(expected);
            });

            it('本月最早', function () {
                expected = utils.minToday(new Date(2017, 1, 1));
                expect(utils.minThisMonth(theDay)).eql(expected);
            });

            it('本月最晚', function () {
                expected = utils.maxToday(new Date(2017, 1, 28));
                expect(utils.maxThisMonth(theDay)).eql(expected);
            });
        });
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
        describe('微信MD5签名', function () {
            var weixinSignMD5, md5Stub, key, signResult, data;
            beforeEach(function () {
                key = 'hdhhdvdveqr';
                signResult = 'ddJfvndFnvdfgbsfbfg';
                data = {
                    sss: 1,
                    a: 567,
                    bbb: 2
                };
            });

            it('MD5签名', function () {
                md5Stub = sinon.stub();
                md5Stub.withArgs("a=567&bbb=2&sss=1&key=" + key).returns(signResult);
                stubs['md5'] = md5Stub;
                weixinSignMD5 = proxyquire('../modules/weixinsignmd5', stubs);

                expect(weixinSignMD5(data, key)).eql(signResult.toUpperCase());
            });
        });

        describe('微信接口配置', function () {
            var config;
            var appid, appsecret, mch_id, mch_key;
            var apiBaseURL, oauth2BaseURL;
            var payServerIp, payNotifyUrl;
            var nonce, nonceStub, sign, signStub, timestamp, timestampStub;

            beforeEach(function () {
                appid = 'appid';
                appsecret = 'appsecret';
                mch_id = 'eveqveqfvfvff';
                mch_key = 'womendoushiwutaishanjingyinsidet';
                apiBaseURL = 'apiBaseURL';
                oauth2BaseURL = 'oauth2BaseURL';
                siteBaseUrl = 'http://www.site.com';
                payServerIp = '121.41.93.210';
                payNotifyUrl = 'http://jingyintemple.top/jingyin/manjusri/pay/notify';
                nonce = 'adasfsfsgsgd';
                sign = 'dbcwgf4y84cwcned34r';
                timestamp = 4456457458865;
                nonceStub = sinon.stub();
                nonceStub.returns(nonce);
                signStub = sinon.stub();
                timestampStub = sinon.stub();
                timestampStub.returns(timestamp);

                config = require('../modules/weixinconfig')({
                    apiBaseURL: apiBaseURL,
                    appId: appid,
                    appSecret: appsecret,
                    oauth2BaseURL: oauth2BaseURL,
                    mchId: mch_id,
                    mchKey: mch_key,
                    siteBaseUrl: siteBaseUrl,
                    payServerIp: payServerIp,
                    payNotifyUrl: payNotifyUrl
                });
            });

            describe('网页授权url', function () {
                it('url未包含授权网站的BaseUrl', function () {
                    var url = "/foo/fee";
                    var expectedUrl = oauth2BaseURL + "?appid=" + appid
                        + "&redirect_uri=" + siteBaseUrl + url
                        + "&response_type=code&scope=snsapi_base#wechat_redirect";
                    expect(config.wrapRedirectURLByOath2WayBaseScope(url))
                        .eql(expectedUrl);
                });

                it('url已包含授权网站的BaseUrl', function () {
                    var url = siteBaseUrl + "/foo/fee";
                    var expectedUrl = oauth2BaseURL + "?appid=" + appid
                        + "&redirect_uri=" + url
                        + "&response_type=code&scope=snsapi_base#wechat_redirect";
                    expect(config.wrapRedirectURLByOath2WayBaseScope(url))
                        .eql(expectedUrl);
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
            });

            it('获得微信用户信息的Url', function () {
                var token = '1234534566';
                var openid = 'hfcqehcehrv3f42f24yf34f';
                var url = 'https://api.weixin.qq.com/cgi-bin/user/info?' +
                    'access_token=' + token + '&openid=' + openid + '&lang=zh_CN';
                expect(config.getUrlToGetUserInfo(token, openid)).eql(url);
            });

            it('获得检验授权凭证（access_token）是否有效的Url', function () {
                var token = '1234534566';
                var openid = 'hfcqehcehrv3f42f24yf34f';
                var url = 'https://api.weixin.qq.com/sns/auth?' +
                    'access_token=' + token + '&openid=' + openid;
                expect(config.getUrlToCheckAccessToken(token, openid)).eql(url);
            });

            it('拼装预置微信支付请求', function () {
                var openId = 'foo-openid';
                var transId = 'transOrderNo';
                var transName = 'transOrder description';
                var amount = 58.7;

                var orderToSign = {
                    out_trade_no: transId,
                    body: transName,
                    detail: transName,
                    notify_url: payNotifyUrl,
                    openid: openId,
                    spbill_create_ip: payServerIp,
                    total_fee: Math.round(amount * 100),
                    attach: "jingyin",
                    appid: appid,
                    mch_id: mch_id,
                    nonce_str: nonce,
                    trade_type: "JSAPI",
                };
                var order = Object.assign({}, orderToSign);
                order.sign = sign;
                var prepayOrderXML = js2xmlparser.parse('xml', order);

                var expectedOption = {
                    url: 'https://api.mch.weixin.qq.com:443/pay/unifiedorder',
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/xml',
                        "Content-Length": Buffer.byteLength(prepayOrderXML)
                    }
                }

                config.setNonceGenerator(nonceStub);
                signStub.withArgs(orderToSign, mch_key).returns(sign);
                config.setSignMD5(signStub);

                var result = config.getPrepayRequestOption(openId, transId, transName, amount);
                var bodyXml = result.body;
                delete result.body;

                expect(result).eql(expectedOption);
                expect(bodyXml).xml.to.equal(prepayOrderXML);
            });

            it('产生微信支付数据', function () {
                var prepayId = '234677889O9';
                var payDataToSign = {
                    appId: appid,
                    package: 'prepay_id=' + prepayId,
                    timeStamp: timestamp,
                    nonceStr: nonce,
                    signType: 'MD5'
                };

                config.setNonceGenerator(nonceStub);
                config.setTimestampGenerator(timestampStub);
                signStub.withArgs(payDataToSign, mch_key).returns(sign);
                config.setSignMD5(signStub);

                var payData = config.generatePayData(prepayId);
                var expectedPayData = payDataToSign;
                expectedPayData.paySign = sign;
                expectedPayData.prepay_id = prepayId;
                expect(payData).eql(expectedPayData);
            });

            describe('解读由微信给出的支付数据', function () {
                var paydata, openId, out_trade_no, transaction_id, sign;

                beforeEach(function () {
                    openId = 'wdgqeurf1bsdncsdvnefnf';
                    out_trade_no = '12345';
                    transaction_id = '98765';
                    sign = 'weergqergqergwerh45g1g';

                    paydata = {
                        result_code: 'SUCCESS',
                        return_code: 'SUCCESS',
                        openid: openId,
                        out_trade_no: out_trade_no,
                        transaction_id: transaction_id,
                        sign: sign
                    }

                    var paydataToSign = Object.assign({}, paydata);
                    delete paydataToSign.sign;
                    signStub.withArgs(paydataToSign, mch_key).returns(sign);
                    config.setSignMD5(signStub);
                });

                it('result_code!=SUCCESS则表示不成功', function () {
                    delete paydata.result_code;
                    var result = config.parsePaymentNotification(paydata);
                    expect(result.pass).to.be.false;
                });

                it('return_code!=SUCCESS则表示不成功', function () {
                    delete paydata.return_code;
                    var result = config.parsePaymentNotification(paydata);
                    expect(result.pass).to.be.false;
                });

                it('签名不一致则表示不成功', function () {
                    delete paydata.sign;
                    var result = config.parsePaymentNotification(paydata);
                    expect(result.pass).to.be.false;
                });

                it('支付成功', function () {
                    var result = config.parsePaymentNotification(paydata);
                    expect(result.pass).to.be.true;
                    expect(result.openId).eql(openId);
                    expect(result.virtueId).eql(out_trade_no);
                    expect(result.paymentNo).eql(transaction_id);
                });
            });
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
                    requestStub = createPromiseStub([{url: urlToGetOpenId, json: true}], null, err);
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

                    requestStub = createPromiseStub([{url: urlToGetOpenId, json: true}], [dataFromWeixin]);
                    stubs['./httprequest'] = {concat: requestStub}

                    weixinFactory = proxyquire('../modules/weixinfactory', stubs);
                    weixin = weixinFactory(weixinConfig);
                    return weixin.getOpenId(code)
                        .then(function (data) {
                            expect(data).eql(dataFromWeixin);
                        }, function (error) {
                            throw 'should not goes here';
                        });
                });
            })

            describe('获得特定OpenId的用户信息', function () {
                var openid, accesstoken, getAccessTokenStub;
                var requestStub, userInfo;

                beforeEach(function () {
                    openid = '123457744333';
                    accesstoken = 'cehqdcqeceqeg4h66n';
                    userInfo = {foo: 'foo user info'}

                    urlToGetUserInfo = 'https:/api.weixin.qq.com/cgi-bin/getuserinfo...';
                    var getUrlToGetUserInfoStub = sinon.stub();
                    getUrlToGetUserInfoStub.withArgs(accesstoken, openid).returns(urlToGetUserInfo);
                    weixinConfig.getUrlToGetUserInfo = getUrlToGetUserInfoStub;
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
                    requestStub = createPromiseStub([{url: urlToGetUserInfo, json: true}], null, err);
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
                    getAccessTokenStub = createPromiseStub(null, [accesstoken]);
                    requestStub = createPromiseStub([{url: urlToGetUserInfo, json: true}], [userInfo]);
                    stubs['./httprequest'] = {concat: requestStub}

                    weixinFactory = proxyquire('../modules/weixinfactory', stubs);
                    weixin = weixinFactory(weixinConfig);
                    weixin.getAccessToken = getAccessTokenStub;

                    return weixin.getUserInfoByOpenId(openid)
                        .then(function (data) {
                            expect(data).eql(userInfo);
                        }, function (error) {
                            throw 'should not goes here';
                        });
                })
            });

            describe('准备微信支付单', function () {
                var openId, transId, transName, amount;
                var prepayRequestOption;
                var prepayRequestStub;

                beforeEach(function () {
                    openId = 'foo-openid';
                    transId = 'transOrderNo';
                    transName = 'transOrder description';
                    amount = 58.7;

                    prepayRequestOption = {url: 'http://ssssss/ssss', methods: 'POST', body: 'any data in boby'};
                    var getPrepayRequestOptionStub = sinon.stub();
                    getPrepayRequestOptionStub.withArgs(openId, transId, transName, amount).returns(prepayRequestOption);
                    weixinConfig.getPrepayRequestOption = getPrepayRequestOptionStub;
                });

                it('请求预置微信支付失败', function () {
                    prepayRequestStub = createPromiseStub([prepayRequestOption], null, err);
                    stubs['./httprequest'] = {concat: prepayRequestStub}
                    weixinFactory = proxyquire('../modules/weixinfactory', stubs);
                    weixin = weixinFactory(weixinConfig);

                    return weixin.prepay(openId, transId, transName, amount)
                        .then(function () {
                            throw 'should not goes here';
                        }, function (error) {
                            expect(error).eql(err);
                        });
                });

                it('预置微信支付单未成功', function () {
                    var prepayXml = '<xml><err_code_desc>abcdefg</err_code_desc></xml>';

                    prepayRequestStub = createPromiseStub([prepayRequestOption], [prepayXml]);
                    stubs['./httprequest'] = {concat: prepayRequestStub}
                    weixinFactory = proxyquire('../modules/weixinfactory', stubs);
                    weixin = weixinFactory(weixinConfig);

                    return weixin.prepay(openId, transId, transName, amount)
                        .then(function (prepayid) {
                            throw 'should not goes here';
                        }, function (error) {
                            expect(error).eql(new Error('abcdefg'));
                        });
                });

                it('准备微信支付单', function () {
                    var prepayXml = '<xml><return_code><![CDATA[SUCCESS]]></return_code>' +
                        ' <return_msg><![CDATA[OK]]></return_msg> ' +
                        '<appid><![CDATA[wx76c06da9928cd6c3]]></appid>' +
                        ' <mch_id><![CDATA[1364986702]]></mch_id>' +
                        ' <nonce_str><![CDATA[mtQySHbBzr0BRIlY]]></nonce_str>' +
                        ' <sign><![CDATA[EB3B9DABCFF551E5185016E1E26C98BE]]></sign>' +
                        ' <result_code><![CDATA[SUCCESS]]></result_code>' +
                        ' <prepay_id><![CDATA[wx20161201131507f7a93ee1c90980898906]]></prepay_id>' +
                        ' <trade_type><![CDATA[JSAPI]]></trade_type> </xml>'

                    prepayRequestStub = createPromiseStub([prepayRequestOption], [prepayXml]);
                    stubs['./httprequest'] = {concat: prepayRequestStub}
                    weixinFactory = proxyquire('../modules/weixinfactory', stubs);
                    weixin = weixinFactory(weixinConfig);

                    var payData = {foo: 'foo', fee: 'fee', fuu: 'fuu'}
                    var genPayDataStub = sinon.stub();
                    genPayDataStub.withArgs('wx20161201131507f7a93ee1c90980898906').returns(payData);
                    weixinConfig.generatePayData = genPayDataStub;

                    return weixin.prepay(openId, transId, transName, amount)
                        .then(function (data) {
                            expect(data).eql(payData);
                        }, function (error) {
                            throw 'should not goes here';
                        });
                });
            });
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
        });

        describe('服务端控制', function () {

            describe('资源注册', function () {
                it('getLink', function () {
                    var linkage = require('../server/rests');
                    expect(linkage.getLink("virtue", {id: 234567})).eql("/jingyin/rest/virtues/234567");
                    expect(linkage.getLink("pay", {virtue: 234567}))
                        .eql("/jingyin/manjusri/pay/confirm?virtue=234567");
                    expect(linkage.getLink("login")).eql("/jingyin/manjusri/login");
                });

                it('如果指定资源未注册，getLink返回null', function () {
                    var linkage = require('../server/rests');
                    expect(linkage.getLink("not exist")).to.be.null;
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
                    if (err) {
                        var actual = resSendSyp.getCall(0).args[0];
                        expect(actual instanceof Error).true;
                        expect(actual.message).eql(err.message);
                    }
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
                        controller = require('../server/wechat/wechat');
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
                            var user = {name: 'foo'};
                            var registerUserStub = createPromiseStub([null, openid], [user]);
                            stubs['../modules/users'] = {
                                register: registerUserStub
                            };

                            var answer = {foo: 'foo'};
                            var welcomeStub = createPromiseStub([user], [answer]);
                            stubs['../modules/welcome'] = welcomeStub;

                            controller = proxyquire('../server/wechat/wechat', stubs);
                            controller(reqStub, resStub);
                            expect(msgReplySpy).calledWith(answer);
                        });
                    });
                });

                describe('重定向', function () {
                    beforeEach(function () {
                    });

                    it('重定向到经微信认证的登录', function () {
                        reqStub.session = {};

                        var loginUrl = "redirects page url";
                        restUrlMapStub = sinon.stub();
                        restUrlMapStub.withArgs("login").returns(loginUrl);
                        stubs['../rests'] = {getLink: restUrlMapStub};

                        var auth2WrapedUrl = 'url/to/auth2WrapedUrl';
                        var urlWrapStub = sinon.stub();
                        urlWrapStub.withArgs(loginUrl).returns(auth2WrapedUrl);
                        stubs['../weixin'] = {weixinConfig: {wrapRedirectURLByOath2Way: urlWrapStub}};

                        var redirctSpy = sinon.spy();
                        resStub.redirect = redirctSpy;

                        controller = proxyquire('../server/wechat/redirects', stubs).toLogin;
                        controller(reqStub, resStub);

                        expect(redirctSpy).calledOnce.calledWith(auth2WrapedUrl);
                    });

                    it('重定向到用户注册页面', function () {
                        var openid = "12324556";
                        var url = "user/register/url";
                        restUrlMapStub = sinon.stub();
                        restUrlMapStub.withArgs("profile", {openid: openid}).returns(url);
                        stubs['../rests'] = {getLink: restUrlMapStub};

                        var redirctSpy = sinon.spy();
                        resStub.redirect = redirctSpy;

                        controller = proxyquire('../server/wechat/redirects', stubs).toProfile;
                        controller(openid, reqStub, resStub);

                        expect(redirctSpy).calledOnce.calledWith(url);
                    });

                    it('重定向到首页', function () {
                        var url = "user/home";
                        restUrlMapStub = sinon.stub();
                        restUrlMapStub.withArgs("home").returns(url);
                        stubs['../rests'] = {getLink: restUrlMapStub};

                        var redirctSpy = sinon.spy();
                        resStub.redirect = redirctSpy;

                        controller = proxyquire('../server/wechat/redirects', stubs).toHome;
                        controller(reqStub, resStub);

                        expect(redirctSpy).calledOnce.calledWith(url);
                    });
                });

                describe('用户登录', function () {
                    var code, openid, accesstoken, refresh_token, lord;

                    beforeEach(function () {
                        reqStub.session = {};
                        code = '12345678';
                        openid = 'ahbsdbjvhqervhr3';
                        accesstoken = 'eurf3urf3urfr3r';
                        refresh_token = 'abdfdgdhdhdhdhdh';
                        lord = {name: "foo"};
                    });

                    it('请求未包含查询参数code，客户端400错', function () {
                        controller = require('../server/wechat/manjusri').login;
                        controller(reqStub, resStub);
                        expect(statusSpy).calledWith(400).calledOnce;
                    });

                    it('获得当前用户的OpenId失败', function () {
                        reqStub.query.code = code;
                        var getOpenIdStub = createPromiseStub([code], null, err);
                        stubs['../weixin'] = {weixinService: {getOpenId: getOpenIdStub}};
                        controller = proxyquire('../server/wechat/manjusri', stubs).login;
                        return controller(reqStub, resStub)
                            .then(function () {
                                checkResponseStatusCodeAndMessage(400, null, err);
                            });
                    });

                    it('当前用户为一个新用户， 如果系统在试图获取用户信息时失败， 则系统报500错', function () {
                        reqStub.query.code = code;
                        var getOpenIdStub = createPromiseStub([code], [{
                            "access_token": accesstoken,
                            "refresh_token": refresh_token,
                            "openid": openid
                        }]);

                        var findUserStub = createPromiseStub([openid], [null]);
                        stubs['../modules/users'] = {findByOpenid: findUserStub};

                        var getUserInfoByOpenIdAndTokenStub = createPromiseStub([accesstoken, openid], null, err);
                        stubs['../weixin'] = {
                            weixinService: {
                                getOpenId: getOpenIdStub,
                                getUserInfoByOpenIdAndToken: getUserInfoByOpenIdAndTokenStub
                            }
                        };

                        controller = proxyquire('../server/wechat/manjusri', stubs).login;
                        return controller(reqStub, resStub)
                            .then(function () {
                                checkResponseStatusCodeAndMessage(500, null, err);
                            });
                    });

                    it('当前用户为一个新用户， 如果添加新用户时失败， 则系统报500错', function () {
                        reqStub.query.code = code;
                        var getOpenIdStub = createPromiseStub([code], [{
                            "access_token": accesstoken,
                            "refresh_token": refresh_token,
                            "openid": openid
                        }]);

                        var findUserStub = createPromiseStub([openid], [null]);
                        stubs['../modules/users'] = {findByOpenid: findUserStub};

                        var userInfoFromWeixin = {
                            nickname: "nickname",
                            openid: "openid",
                            headimgurl: "headimgurl",
                            city: "city",
                            province: "province",
                            sex: "1",
                            subscribe_time: "subscribetime"
                        }
                        var userInfo = {
                            name: userInfoFromWeixin.nickname,
                            openid: userInfoFromWeixin.openid,
                            img: userInfoFromWeixin.headimgurl,
                            city: userInfoFromWeixin.city,
                            province: userInfoFromWeixin.province,
                            sex: userInfoFromWeixin.sex,
                            subscribe: userInfoFromWeixin.subscribe_time
                        }

                        var getUserInfoByOpenIdAndTokenStub = createPromiseStub([accesstoken, openid], [userInfoFromWeixin]);
                        stubs['../weixin'] = {
                            weixinService: {
                                getOpenId: getOpenIdStub,
                                getUserInfoByOpenIdAndToken: getUserInfoByOpenIdAndTokenStub
                            }
                        };

                        var registerUserStub = createPromiseStub([userInfo], null, err);
                        stubs['../modules/users'].registerUser = registerUserStub;

                        controller = proxyquire('../server/wechat/manjusri', stubs).login;
                        return controller(reqStub, resStub)
                            .then(function () {
                                checkResponseStatusCodeAndMessage(500, null, err);
                            });
                    });

                    it('当前用户为一个新用户时，以新用户的身份登录，并重定向到用户注册页面', function () {
                        reqStub.query.code = code;
                        var getOpenIdStub = createPromiseStub([code], [{
                            "access_token": accesstoken,
                            "refresh_token": refresh_token,
                            "openid": openid
                        }]);
                        stubs['../weixin'] = {weixinService: {getOpenId: getOpenIdStub}};

                        var findUserStub = createPromiseStub([openid], [null]);
                        stubs['../modules/users'] = {findByOpenid: findUserStub};

                        var userInfoFromWeixin = {
                            nickname: "nickname",
                            openid: "openid",
                            headimgurl: "headimgurl",
                            city: "city",
                            province: "province",
                            sex: "1",
                            subscribe_time: "subscribetime"
                        }
                        var userInfo = {
                            name: userInfoFromWeixin.nickname,
                            openid: userInfoFromWeixin.openid,
                            img: userInfoFromWeixin.headimgurl,
                            city: userInfoFromWeixin.city,
                            province: userInfoFromWeixin.province,
                            sex: userInfoFromWeixin.sex,
                            subscribe: userInfoFromWeixin.subscribe_time
                        }

                        var getUserInfoByOpenIdAndTokenStub = createPromiseStub([accesstoken, openid], [userInfoFromWeixin]);
                        stubs['../weixin'] = {
                            weixinService: {
                                getOpenId: getOpenIdStub,
                                getUserInfoByOpenIdAndToken: getUserInfoByOpenIdAndTokenStub
                            }
                        };

                        var user = {name: "foo"}
                        var registerUserStub = createPromiseStub([userInfo], [user]);
                        stubs['../modules/users'].registerUser = registerUserStub;

                        var redirectToProfileSpy = sinon.spy();
                        stubs['./redirects'] = {toProfile: redirectToProfileSpy};

                        controller = proxyquire('../server/wechat/manjusri', stubs).login;
                        return controller(reqStub, resStub)
                            .then(function () {
                                expect(reqStub.session.user).eql({access_token: accesstoken, openid: openid});
                                expect(reqStub.session.refresh_token).eql(refresh_token);
                                expect(redirectToProfileSpy).calledOnce.calledWith(openid, reqStub, resStub);
                            });
                    });

                    it('当前用户已存在，登录成功，如果session中有重定向url，则按此重定向', function () {
                        var redirectToUrl = "foo/url";
                        reqStub.query.code = code;
                        reqStub.session.redirectToUrl = redirectToUrl;

                        var getOpenIdStub = createPromiseStub([code], [{
                            "access_token": accesstoken,
                            "refresh_token": refresh_token,
                            "openid": openid
                        }]);
                        stubs['../weixin'] = {weixinService: {getOpenId: getOpenIdStub}};

                        var user = {name: "foo"};
                        var findUserStub = createPromiseStub([openid], [user]);
                        stubs['../modules/users'] = {findByOpenid: findUserStub};

                        var redirectSpy = sinon.spy();
                        resStub.redirect = redirectSpy;
                        controller = proxyquire('../server/wechat/manjusri', stubs).login;
                        return controller(reqStub, resStub)
                            .then(function () {
                                expect(reqStub.session.user).eql({access_token: accesstoken, openid: openid});
                                expect(reqStub.session.refresh_token).eql(refresh_token);
                                expect(redirectSpy).calledOnce.calledWith(redirectToUrl);
                            });
                    });

                    it('当前用户已存在，登录成功，如果session中无重定向url，则重定向至首页', function () {
                        reqStub.query.code = code;

                        var getOpenIdStub = createPromiseStub([code], [{
                            "access_token": accesstoken,
                            "refresh_token": refresh_token,
                            "openid": openid
                        }]);
                        stubs['../weixin'] = {weixinService: {getOpenId: getOpenIdStub}};

                        var user = {name: "foo"};
                        var findUserStub = createPromiseStub([openid], [user]);
                        stubs['../modules/users'] = {findByOpenid: findUserStub};

                        var redirectToHomeSpy = sinon.spy();
                        stubs['./redirects'] = {toHome: redirectToHomeSpy};

                        controller = proxyquire('../server/wechat/manjusri', stubs).login;
                        return controller(reqStub, resStub)
                            .then(function () {
                                expect(reqStub.session.user).eql({access_token: accesstoken, openid: openid});
                                expect(reqStub.session.refresh_token).eql(refresh_token);
                                expect(redirectToHomeSpy).calledOnce.calledWith(reqStub, resStub);
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
                    var virtueId, openId, virtue, payData;
                    var getOpenIdStub, findNewVirtueByIdStub, prepayStub;

                    beforeEach(function () {
                        virtueId = 'bbsd3fg12334555';
                        virtue = {
                            subject: {name: 'foo'},
                            amount: 300
                        };
                        openId = 'gfghhfhjfjkfkfkf';
                        payData = {foo: 'foo', fee: 'fee'};

                        reqStub.session = {user: {openid: openId}};
                        reqStub.query.virtue = virtueId;
                    });

                    it('请求中未包含virtue的查询变量', function () {
                        delete reqStub.query.virtue;
                        controller = proxyquire('../server/wechat/payment', stubs).pay;
                        controller(reqStub, resStub);
                        return checkResponseStatusCodeAndMessage(400, null, new Error('virtue is not found in query'));
                    });

                    it('查找捐助交易操作失败', function () {
                        findNewVirtueByIdStub = createPromiseStub([virtueId], null, err);
                        stubs['../modules/virtues'] = {findNewVirtueById: findNewVirtueByIdStub};

                        controller = proxyquire('../server/wechat/payment', stubs).pay;
                        return controller(reqStub, resStub)
                            .then(function () {
                                checkResponseStatusCodeAndMessage(400, null, err);
                            });
                    });

                    it('未查找到指定的捐助交易', function () {
                        findNewVirtueByIdStub = createPromiseStub([virtueId], [null]);
                        stubs['../modules/virtues'] = {findNewVirtueById: findNewVirtueByIdStub};

                        controller = proxyquire('../server/wechat/payment', stubs).pay;
                        return controller(reqStub, resStub)
                            .then(function () {
                                var error = new Error('The virtue[id=' + virtueId + '] is not found');
                                checkResponseStatusCodeAndMessage(400, null, error);
                            });
                    });

                    it('预置微信支付操作失败', function () {
                        findNewVirtueByIdStub = createPromiseStub([virtueId], [virtue]);
                        stubs['../modules/virtues'] = {findNewVirtueById: findNewVirtueByIdStub};
                        prepayStub = createPromiseStub([openId, virtueId, 'foo', 300], null, err);
                        stubs['../weixin'] = {weixinService: {prepay: prepayStub}};

                        controller = proxyquire('../server/wechat/payment', stubs).pay;
                        return controller(reqStub, resStub)
                            .then(function () {
                                checkResponseStatusCodeAndMessage(400, null, err);
                            });
                    });

                    it('渲染前端进行微信支付', function () {
                        findNewVirtueByIdStub = createPromiseStub([virtueId], [virtue]);
                        stubs['../modules/virtues'] = {findNewVirtueById: findNewVirtueByIdStub};
                        prepayStub = createPromiseStub([openId, virtueId, 'foo', 300], [payData]);
                        stubs['../weixin'] = {weixinService: {prepay: prepayStub}};

                        controller = proxyquire('../server/wechat/payment', stubs).pay;
                        return controller(reqStub, resStub)
                            .then(function () {
                                expect(resRenderSpy).calledWith('wechat/payment', {
                                    openId: openId,
                                    virtue: virtueId,
                                    payData: payData
                                });
                            });
                    });
                });

                describe('响应微信支付结果', function () {
                    //TODO: 编写响应微信支付结果的测试用例
                });

                describe('功德主', function () {
                    var token, openid, lord, virtues, viewdata;
                    var getOpenIdStub, getUserByOpenIdStub, listLordVirtuesStub;

                    beforeEach(function () {
                        token = 'ddfffffdffffffffff';
                        openid = 'gfghhfhjfjkfkfkf';
                        lord = {
                            _id: '587240dea0191d6754dcc0ba',
                            name: 'foo'
                        }
                        virtues = [{foo: "foo"}, {fee: "fee"}];
                        viewdata = {lord: lord, virtues: virtues};

                        reqStub.session = {
                            user: {access_token: token, openid: openid},
                        };
                    });

                    it('未能成功获得当前用户', function () {
                        getUserByOpenIdStub = createPromiseStub([openid], null, err);
                        stubs['../modules/users'] = {findByOpenid: getUserByOpenIdStub};

                        controller = proxyquire('../server/wechat/manjusri', stubs).lordVirtues;
                        return controller(reqStub, resStub)
                            .then(function () {
                                checkResponseStatusCodeAndMessage(500, null, err);
                            });
                    });

                    it('没有找到当前用户', function () {
                        getUserByOpenIdStub = createPromiseStub([openid], [null]);
                        stubs['../modules/users'] = {findByOpenid: getUserByOpenIdStub};

                        controller = proxyquire('../server/wechat/manjusri', stubs).lordVirtues;
                        return controller(reqStub, resStub)
                            .then(function () {
                                var errmsg = "The User with openid(" + openid + ") not exists?";
                                checkResponseStatusCodeAndMessage(500, errmsg);
                            });
                    });

                    it('未能成功获得当前用户的所有捐助', function () {
                        getUserByOpenIdStub = createPromiseStub([openid], [lord]);
                        stubs['../modules/users'] = {findByOpenid: getUserByOpenIdStub};

                        listLordVirtuesStub = createPromiseStub([lord._id], null, err);
                        stubs['../modules/virtues'] = {listLordVirtues: listLordVirtuesStub};

                        controller = proxyquire('../server/wechat/manjusri', stubs).lordVirtues;
                        return controller(reqStub, resStub)
                            .then(function () {
                                checkResponseStatusCodeAndMessage(500, null, err);
                            });
                    });

                    it('成功显示功德主页面', function () {
                        getUserByOpenIdStub = createPromiseStub([openid], [lord]);
                        stubs['../modules/users'] = {findByOpenid: getUserByOpenIdStub};

                        listLordVirtuesStub = createPromiseStub([lord._id], [virtues]);
                        stubs['../modules/virtues'] = {listLordVirtues: listLordVirtuesStub};

                        controller = proxyquire('../server/wechat/manjusri', stubs).lordVirtues;
                        controller(reqStub, resStub);
                        expect(resRenderSpy).calledOnce.calledWith('wechat/lordVirtues', viewdata);
                    });
                });
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
        });
    });
});


