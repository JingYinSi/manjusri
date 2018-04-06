/**
 * Created by clx on 2017/10/9.
 */
var proxyquire = require('proxyquire'),
    _ = require('underscore'),
    mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    finelets = require('@finelets/hyper-rest'),
    dbSave = finelets.db.mongoDb.save;

describe('Jingyin Manjusri', function () {
    var stubs, err;
    beforeEach(function () {
        stubs = {};
        err = new Error('any error message');
    });

    describe('application', function () {
        describe('SessionUser', function () {
            var openid, user;
            var findUserByOpenIdStub, listLessonsStub;
            beforeEach(function () {
                openid = 'o0ghywcfW_2Dp4oN-7NADengZAVM';
                findUserByOpenIdStub = sinon.stub();
                listLessonsStub = sinon.stub();
            });

            it('未发现任何一个用户具有指定的openid', function () {
                findUserByOpenIdStub.withArgs(openid).returns(Promise.resolve(null));
                stubs['./users'] = {findByOpenid: findUserByOpenIdStub};
                return proxyquire('../server/modules/2.1/SessionUser', stubs)(openid)
                    .then(function () {
                        throw 'failed';
                    })
                    .catch(function (reason) {
                        expect(reason).eqls({
                            code: 401,
                            err: 'the user with openid ' + openid + ' not found!'
                        })
                    })
            });

            it('可以列出指定openid的用户功课完成情况', function () {
                var lessondetails = {lessondetails: "lessondetails"};
                var userid = "123456";
                findUserByOpenIdStub.withArgs(openid).returns(Promise.resolve({id: userid}));
                stubs['./users'] = {findByOpenid: findUserByOpenIdStub};
                listLessonsStub.withArgs(userid).returns(Promise.resolve(lessondetails));
                stubs['./lessons'] = {listLessons: listLessonsStub};
                return proxyquire('../server/modules/2.1/SessionUser', stubs)(openid)
                    .then(function (user) {
                        return user.listLessonDetails()
                    })
                    .then(function (data) {
                        expect(data).eqls(lessondetails);
                    })
            })
        });

        describe('开发环境下', function () {
            beforeEach(function () {
                session = require('../server/modules/2.1/sessionForDevMode')();
            });

            it('在开发环境下将缺省返回一个测试用openid', function () {
                expect(session.getOpenId().length > 0).eqls(true);
            });

            it('在开发环境下可以通过环境变量OPENID设置测试用openid', function () {
                process.env.OPENID = 'o0ghywcfW_2Dp4oN-7NADengZAVk';
                expect(session.getOpenId()).eqls(process.env.OPENID);
            })
        });
    });

    describe('数据库', function () {
        var dbConnection, model;
        beforeEach(function (done) {
            mongoose.Promise = global.Promise;
            clearDB(done);
        });

        it('Db object saver', function () {
            var dbSchema = new Schema({
                "foo": String,
                "fee": String
            });
            model = mongoose.model('coll', dbSchema);

            dataToAdd = {foo: "foo", fee: "fee"};
            return dbSave(model, dataToAdd)
                .then(function (data) {
                    expect(data).not.null;
                    return model.find()
                })
                .then(function (data) {
                    expect(data.length).eqls(1);
                })
        });

        describe('Users', function () {
            var users;
            beforeEach(function () {
                users = require('../server/modules/2.1/users');
            })

            describe('findByOpenid', function () {
                var dbmodel, openid, userData;
                before(function () {
                    dbmodel = require('../server/wechat/models/user');
                    openid = 'o0ghywcfW_2Dp4oN-7NADengZAVM';
                    userData = {openid: openid, name: 'foo name'};
                });

                it('not found', function () {
                    return users.findByOpenid(openid)
                        .then(function (data) {
                            expect(data).null;
                        })
                })

                it('found', function () {
                    return dbSave(dbmodel, userData)
                        .then(function () {
                            return users.findByOpenid(openid)
                        })
                        .then(function (data) {
                            delete data.__v;
                            expect(data.id.length > 0).eqls(true);
                            delete data.id;
                            expect(data).eqls(userData);
                        })
                })
            })
        })
    });
});
