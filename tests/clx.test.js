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
    var func, stubs, err, reason, createReasonStub;
    beforeEach(function () {
        stubs = {};
        err = new Error('any error message');
        reason = {reason: 'any reason representing any error'}
        createReasonStub = sinon.stub();
        stubs['@finelets/hyper-rest/app'] = {createErrorReason: createReasonStub};
    });

    describe('application', function () {
        describe('SessionUser', function () {
            var openid, userid, userMock, lessonId, lessondetails;
            var findUserByOpenIdStub, lessonDetailsStub;

            beforeEach(function () {
                openid = 'o0ghywcfW_2Dp4oN-7NADengZAVM';
                userid = "123456";
                userMock = {id: userid};
                lessonId = "abcdef";
                lessondetails = {lessondetails: "lessondetails"};

                findUserByOpenIdStub = sinon.stub();
                stubs['./users'] = {findByOpenid: findUserByOpenIdStub};

                lessonDetailsStub = sinon.stub();
            });

            it('未发现任何一个用户具有指定的openid', function () {
                findUserByOpenIdStub.withArgs(openid).returns(Promise.resolve(null));
                var reason = {reason: 'foo reason'}
                createReasonStub.withArgs(404, 'the user with openid ' + openid + ' not found!').returns(reason);
                return proxyquire('../server/modules/2.1/SessionUser', stubs)(openid)
                    .then(function () {
                        throw 'failed';
                    })
                    .catch(function (err) {
                        expect(err).eqls(reason);
                    })
            });

            it('可以获得当前会话用户', function () {
                findUserByOpenIdStub.withArgs(openid).returns(Promise.resolve(userMock));
                return proxyquire('../server/modules/2.1/SessionUser', stubs)(openid)
                    .then(function (sessionUser) {
                        expect(sessionUser.user).eqls(userMock);
                    })
            });

            it('可以列出指定openid的用户功课完成情况', function () {
                findUserByOpenIdStub.withArgs(openid).returns(Promise.resolve(userMock));
                lessonDetailsStub.withArgs(userid).returns(Promise.resolve(lessondetails));
                stubs['./Practics'] = {listDetails: lessonDetailsStub};
                return proxyquire('../server/modules/2.1/SessionUser', stubs)(openid)
                    .then(function (user) {
                        return user.listLessonDetails()
                    })
                    .then(function (data) {
                        expect(data).eqls(lessondetails);
                    })
            });

            it('可以列出指定openid的用户指定功课完成情况', function () {
                findUserByOpenIdStub.withArgs(openid).returns(Promise.resolve(userMock));
                lessonDetailsStub.withArgs(userid, lessonId).returns(Promise.resolve(lessondetails));
                stubs['./Practics'] = {lessonDetails: lessonDetailsStub};
                return proxyquire('../server/modules/2.1/SessionUser', stubs)(openid)
                    .then(function (user) {
                        return user.lessonDetails(lessonId);
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
        var dbModels, createObjectIdStub;
        before(function () {
            mongoose.Promise = global.Promise;
            dbModels = require('../server/wechat/models');
        });

        beforeEach(function (done) {
            createObjectIdStub = sinon.stub();
            stubs['@finelets/hyper-rest/db/mongoDb/CreateObjectId'] = createObjectIdStub;
            clearDB(done);
        });

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

        describe('Lessons', function () {
            describe('findById', function () {
                it('标识非法', function () {
                    var id = '1234';
                    createObjectIdStub.withArgs(id).returns(Promise.reject(reason));
                    func = proxyquire('../server/modules/2.1/Lessons', stubs).findById;
                    return func(id)
                        .then(function (data) {
                            throw 'failed';
                        })
                        .catch(function (err) {
                            expect(reason).eqls(err);
                        })
                });

                it('未找到记录', function () {
                    func = require('../server/modules/2.1/Lessons', stubs).findById;
                    return func('5ac0c25b0f72e70cd9d065b0')
                        .then(function (data) {
                            expect(data).null;
                        })
                });

                it('找到记录', function () {
                    var theLesson;
                    func = require('../server/modules/2.1/Lessons', stubs).findById;
                    return dbSave(dbModels.Lessons, {name:'foo'})
                        .then(function (data) {
                            theLesson = data.toJSON();
                            return func(theLesson.id);
                        })
                        .then(function (data) {
                            expect(data).eqls(theLesson);
                        })
                })
            })
        })

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
                    var id = '1234';
                    createObjectIdStub.withArgs(id).returns(Promise.reject(reason));
                    func = proxyquire('../server/modules/2.1/Practics', stubs).listDetails;
                    return func(id)
                        .then(function (data) {
                            throw 'failed';
                        })
                        .catch(function (err) {
                            expect(reason).eqls(err);
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

            describe('列出指定功课指定用户实修详情', function () {
                var userid, lessonId, func;
                var theLesson;
                var LessonsMock;

                beforeEach(function () {
                    userid = "5872ce00376dfa6b8ad85259";
                    lessonId = "abcdce00376dfa6b8ad85259";
                    theLesson = {id: lessonId, theLesson: 'any data about the lesson'}

                    LessonsMock = {
                        findById: sinon.stub()
                    }
                    stubs['./Lessons'] = LessonsMock;
                });

                it('User Id 非法', function () {
                    createObjectIdStub.withArgs('1234').returns(Promise.reject(reason));
                    func = proxyquire('../server/modules/2.1/Practics', stubs).lessonDetails;
                    return func('1234', lessonId)
                        .then(function () {
                            throw 'failed';
                        })
                        .catch(function (err) {
                            expect(err).eqls(reason);
                        })
                });

                it('指定功课不存在', function () {
                    createObjectIdStub.withArgs(userid).returns(Promise.resolve(userid));
                    LessonsMock.findById.withArgs(lessonId).returns(Promise.resolve(null));
                    createReasonStub.withArgs(404, 'the lesson with id ' + lessonId + ' not found!').returns(reason);
                    func = proxyquire('../server/modules/2.1/Practics', stubs).lessonDetails;
                    return func(userid, lessonId)
                        .then(function () {
                            throw 'failed';
                        })
                        .catch(function (err) {
                            expect(err).eqls(reason);
                        })
                });

                it('无指定功课指定用户的实修记录', function () {
                    delete stubs['@finelets/hyper-rest/db/mongoDb/CreateObjectId'];
                    LessonsMock.findById.withArgs(lessonId).returns(Promise.resolve(theLesson));
                    func = proxyquire('../server/modules/2.1/Practics', stubs).lessonDetails;
                    return func(userid, lessonId)
                        .then(function (data) {
                            expect(data).eqls({
                                lesson: theLesson,
                                join: 0,
                                practice: 0,
                                me: {
                                    practice: 0
                                }
                            })
                        })
                });


                describe('列出指定功课指定用户的实修记录', function () {
                    var ObjectId, fooLordId, myId, fooPractics, myPractics;
                    beforeEach(function () {
                        ObjectId = require('mongodb').ObjectId;
                        fooLordId = ObjectId('abcdce00376dfa6b8ad86359');
                        myId = ObjectId(userid);
                        func = require('../server/modules/2.1/Practics').lessonDetails;
                        theLesson = {
                            type:'incant',
                            name: 'foo',
                            img: 'img',
                            unit: '遍'
                        };
                        fooPractics = {
                            lord: fooLordId,
                            num: 100
                        };
                        myPractics = {
                            lord: myId,
                            num: 200
                        };
                        return dbSave(dbModels.Lessons, theLesson)
                            .then(function (data) {
                                theLesson.id = data._doc._id.toString();
                                fooPractics.lesson = theLesson.id;
                                myPractics.lesson = theLesson.id;
                                return dbSave(dbModels.Practices, fooPractics);
                            })
                            .then(function () {
                                return dbSave(dbModels.Practices, myPractics);
                            })
                    });

                    it('念咒型功课', function () {
                        return func(userid, theLesson.id)
                            .then(function (data) {
                                expect(data).eqls({
                                    lesson: theLesson,
                                    join: 2,
                                    practice: 300,
                                    me: {
                                        practice: 200
                                    }
                                })
                            })
                    })
                });
            })
        });
    });
});
