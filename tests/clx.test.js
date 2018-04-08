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
            var findUserByOpenIdStub, listLessonsStub, createReasonStub;
            beforeEach(function () {
                openid = 'o0ghywcfW_2Dp4oN-7NADengZAVM';
                findUserByOpenIdStub = sinon.stub();
                listLessonsStub = sinon.stub();
                createReasonStub = sinon.stub();
            });

            it('未发现任何一个用户具有指定的openid', function () {
                findUserByOpenIdStub.withArgs(openid).returns(Promise.resolve(null));
                stubs['./users'] = {findByOpenid: findUserByOpenIdStub};
                var reason = {reason: 'foo reason'}
                createReasonStub.withArgs(404, 'the user with openid ' + openid + ' not found!').returns(reason);
                stubs['@finelets/hyper-rest/app'] = {createErrorReason: createReasonStub}
                return proxyquire('../server/modules/2.1/SessionUser', stubs)(openid)
                    .then(function () {
                        throw 'failed';
                    })
                    .catch(function (err) {
                        expect(err).eqls(reason);
                    })
            });

            it('可以获得当前会话用户', function () {
                var user = {user: 'foo user'};
                findUserByOpenIdStub.withArgs(openid).returns(Promise.resolve(user));
                stubs['./users'] = {findByOpenid: findUserByOpenIdStub};
                return proxyquire('../server/modules/2.1/SessionUser', stubs)(openid)
                    .then(function (sessionUser) {
                        expect(sessionUser.user).eqls(user);
                    })
            });

            it('可以列出指定openid的用户功课完成情况', function () {
                var lessondetails = {lessondetails: "lessondetails"};
                var userid = "123456";
                findUserByOpenIdStub.withArgs(openid).returns(Promise.resolve({id: userid}));
                stubs['./users'] = {findByOpenid: findUserByOpenIdStub};
                listLessonsStub.withArgs(userid).returns(Promise.resolve(lessondetails));
                stubs['./Practics'] = {listDetails: listLessonsStub};
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
        var db, dbModels;
        before(function () {
            mongoose.Promise = global.Promise;
            dbModels = require('../server/wechat/models');
        });

        beforeEach(function (done) {
            clearDB(done);
        })

        describe('Users', function () {
            var users;
            beforeEach(function () {
                users = require('../server/modules/2.1/users');
            });

            describe('findByOpenid', function () {
                var openid, userData;
                before(function () {
                    openid = 'o0ghywcfW_2Dp4oN-7NADengZAVM';
                    userData = {openid: openid, name: 'foo name'}
                });

                it('not found', function () {
                    return users.findByOpenid(openid)
                        .then(function (data) {
                            expect(data).null;
                        })
                })

                it('found', function () {
                    return dbSave(dbModels.Users, userData)
                        .then(function (data) {
                            return users.findByOpenid(openid);
                        })
                        .then(function (data) {
                            delete data.__v;
                            delete data.id;
                            expect(data).eqls(userData);
                        })
                })
            })
        });

        describe('practics', function () {
            var practics;
            beforeEach(function () {
                practics = require('../server/modules/2.1/Practics');
            });

            describe('列出所有功课实修详情', function () {
                var userid, listDetails;
                beforeEach(function () {
                    userid = "5872ce00376dfa6b8ad85259";
                    listDetails = practics.listDetails;
                });

                it('User Id 非法', function () {
                    return listDetails('1234')
                        .then(function () {
                            throw 'failed';
                        })
                        .catch(function (reason) {
                            expect(reason).not.null;
                            expect(reason).not.eqls('failed');
                        })
                });

                it('无任何功课', function () {
                    return listDetails(userid)
                        .then(function (list) {
                            expect(list).eqls([]);
                        })
                });

                it('需选入状态为open的功课', function () {
                    return dbSave(dbModels.Lessons, {state: 'closed'})
                        .then(function () {
                            return listDetails(userid)
                        })
                        .then(function (list) {
                            expect(list).eqls([]);
                        })
                });

                it('无任何实修记录', function () {
                    var fooLesson = {
                        name: 'foo',
                        img: 'fooimg',
                        unit: 'u',
                        state: 'open'
                    }
                    var fooLessonId;
                    return dbSave(dbModels.Lessons, fooLesson)
                        .then(function (lesson) {
                            fooLessonId = lesson.toJSON().id;
                            return listDetails(userid)
                        })
                        .then(function (list) {
                            expect(list).eqls([{
                                lesson: {
                                    unit: "u",
                                    id: fooLessonId,
                                    name: 'foo',
                                    img: 'fooimg'
                                },
                                "join": 0,
                                "practice": 0,
                                "me": {
                                    "practice": 0
                                }
                            }]);
                        })
                });
            });
        });
    });
});
