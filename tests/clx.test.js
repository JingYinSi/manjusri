/**
 * Created by clx on 2017/10/9.
 */
var proxyquire = require('proxyquire'),
    _ = require('underscore'),
    moment = require('moment'),
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

    describe('日期 utils', function () {
        var utils, theDay, expected;
        beforeEach(function () {
            theDay = new Date(2017, 1, 17);
            utils = require('../modules/utils').dateUtils;
        });

        it('间隔月数', function () {
            expect(utils.offsetMonthes(theDay, new Date(2017, 1, 23))).eqls(0);
            expect(utils.offsetMonthes(theDay, new Date(2017, 2, 23))).eqls(1);
            expect(utils.offsetMonthes(new Date(2017, 4, 10), new Date(2018, 2, 23))).eqls(10);
            expect(utils.offsetMonthes(new Date(2017, 4, 10), new Date(2018, 5, 5))).eqls(13);
        });

        it('间隔天数', function () {
            var moment = require('moment');
            expect(utils.offsetDays(theDay, theDay)).eqls(0);
            expect(utils.offsetDays(theDay, new Date(2017, 1, 18))).eqls(1);
            expect(utils.offsetDays(new Date(2018, 1, 27), new Date(2018, 2, 2))).eqls(3);
        });

        it('间隔周数', function () {
            var moment = require('moment');
            expect(moment('2018-03-02').diff(moment('2018-02-27'), 'days')).eqls(3);
            expect(moment('2018-03-06').diff(moment('2018-02-27'), 'weeks')).eqls(1);
            expect(utils.offsetDays(theDay, new Date(2017, 1, 18))).eqls(1);
            expect(utils.offsetDays(new Date(2018, 1, 27), new Date(2018, 2, 2))).eqls(3);
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

    describe('application', function () {
        describe('SessionUser', function () {
            var openid, userid, userMock, lessonId, lessondetails;
            var findUserByOpenIdStub, practicsStub;

            beforeEach(function () {
                openid = 'o0ghywcfW_2Dp4oN-7NADengZAVM';
                userid = "123456";
                userMock = {id: userid};
                lessonId = "abcdef";
                lessondetails = {lessondetails: "lessondetails"};

                findUserByOpenIdStub = sinon.stub();
                stubs['./users'] = {findByOpenid: findUserByOpenIdStub};

                practicsStub = {
                    // 所有功课的共修情况（包括会话用户本人的实修情况）
                    listDetails: sinon.stub(),
                    // 指定功课的共修情况（包括会话用户本人的实修情况）
                    lessonDetails: sinon.stub(),
                    // 申报会话用户指定共修项目的修量
                    announcePractics: sinon.stub()
                };
                stubs['./Practics'] = practicsStub;
            });

            it('未发现任何一个用户具有指定的openid', function () {
                findUserByOpenIdStub.withArgs(openid).returns(Promise.resolve(null));
                var reason = {reason: 'foo reason'};
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
                        expect(sessionUser.openid).eqls(openid);
                        expect(sessionUser.user).eqls(userMock);
                    })
            });

            it('可以列出指定openid的用户功课完成情况', function () {
                findUserByOpenIdStub.withArgs(openid).returns(Promise.resolve(userMock));
                practicsStub.listDetails.withArgs(userid).returns(Promise.resolve(lessondetails));
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
                practicsStub.lessonDetails.withArgs(userid, lessonId).returns(Promise.resolve(lessondetails));
                return proxyquire('../server/modules/2.1/SessionUser', stubs)(openid)
                    .then(function (user) {
                        return user.lessonDetails(lessonId);
                    })
                    .then(function (data) {
                        expect(data).eqls(lessondetails);
                    })
            });

            it('可以申报指定共修项目的修量', function () {
                findUserByOpenIdStub.withArgs(openid).returns(Promise.resolve(userMock));
                var practics = {practics: 'any practics data'};
                var anydata = {data: 'any data'};
                practicsStub.announcePractics.withArgs(userid, lessonId, practics).returns(Promise.resolve(anydata));
                return proxyquire('../server/modules/2.1/SessionUser', stubs)(openid)
                    .then(function (user) {
                        return user.announcePractics(lessonId, practics);
                    })
                    .then(function (data) {
                        expect(data).eqls(anydata);
                    })
            });
        });
    });

    describe('数据库', function () {
        const ObjectID = require('mongodb').ObjectID,
            dbModels = require('../server/wechat/models');
        var createObjectIdStub;
        before(function () {
            mongoose.Promise = global.Promise;
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
                });

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
                    return dbSave(dbModels.Lessons, {name: 'foo'})
                        .then(function (data) {
                            theLesson = data.toJSON();
                            return func(theLesson.id);
                        })
                        .then(function (data) {
                            expect(data).eqls(theLesson);
                        })
                })
            });

            describe('listOpeningLessons', function () {
                it('无任何功课', function () {
                    func = require('../server/modules/2.1/Lessons').listOpeningLessons;
                    return func()
                        .then(function (list) {
                            expect(list).eqls([]);
                        })
                });

                it('无opening功课', function () {
                    func = require('../server/modules/2.1/Lessons').listOpeningLessons;
                    return dbSave(dbModels.Lessons, {
                        type: 'type',
                        name: 'foo',
                        img: 'img',
                        state: 'not open'
                    })
                        .then(function () {
                            return func();
                        })
                        .then(function (list) {
                            expect(list).eqls([]);
                        })
                });

                it('列出所有opening功课', function () {
                    func = require('../server/modules/2.1/Lessons').listOpeningLessons;
                    var fooId;
                    return dbSave(dbModels.Lessons, {
                        type: 'type',
                        name: 'foo',
                        img: 'img',
                        state: 'open'
                    })
                        .then(function (data) {
                            fooId = data.id;
                            return func(['type', 'name', 'img', 'unit']);
                        })
                        .then(function (list) {
                            expect(list).eqls([{
                                id: fooId,
                                type: 'type',
                                name: 'foo',
                                img: 'img',
                                unit: '遍'
                            }]);
                        })
                })
            })
        });

        describe('practics', function () {
            var userid, lessonId, Practics;
            var LessonsStubs;

            beforeEach(function () {
                userid = "5872ce00376dfa6b8ad85259";
                lessonId = "abcdce00376dfa6b8ad85259";
                Practics = require('../server/modules/2.1/Practics');
                LessonsStubs = {
                    listOpeningLessons: sinon.stub(),
                    findById: sinon.stub()
                };
                stubs['./Lessons'] = LessonsStubs;
            });

            describe('列出所有功课实修详情', function () {
                var listDetails;
                beforeEach(function () {
                    listDetails = Practics.listDetails;
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
                    createObjectIdStub.withArgs(userid).returns(Promise.resolve(ObjectID(userid)));
                    LessonsStubs.listOpeningLessons.returns(Promise.resolve([]));
                    func = proxyquire('../server/modules/2.1/Practics', stubs).listDetails;
                    return func(userid)
                        .then(function (list) {
                            expect(list).eqls([]);
                        })
                });

                it('无任何实修记录', function () {
                    var fooLesson = {foolesson: 'any data of the lesson'};
                    createObjectIdStub.withArgs(userid).returns(Promise.resolve(ObjectID(userid)));
                    LessonsStubs.listOpeningLessons.withArgs(['type', 'name', 'banner', 'img', 'unit']).returns(Promise.resolve([fooLesson]));
                    func = proxyquire('../server/modules/2.1/Practics', stubs).listDetails;
                    return func(userid)
                        .then(function (list) {
                            expect(list).eqls([{
                                lesson: fooLesson,
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
                var func;
                var theLesson;
                var LessonsMock;

                beforeEach(function () {
                    theLesson = {id: lessonId, theLesson: 'any data about the lesson'}
                    LessonsMock = {
                        findById: sinon.stub()
                    };
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
                    createObjectIdStub.withArgs(userid).returns(Promise.resolve(ObjectID(userid)));
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
                            type: 'incant',
                            name: 'foo',
                            img: 'img',
                            unit: '遍'
                        };
                        fooPractics = {
                            lord: fooLordId,
                            give: 'foo give',
                            num: 100
                        };
                        myPractics = {
                            lord: myId,
                            give: 'my give',
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
                                        give: 'my give',
                                        practice: 200
                                    }
                                })
                            })
                    })
                });
            });

            describe('列出当日指定功课所有实修', function (done) {
                var lessons, users, practics;
                beforeEach(function (done) {
                    insertDocsInParallel(dbModels.Lessons, [
                            {name: 'foo'},
                            {name: 'fee'},
                            {name: 'fff'}
                        ],
                        function (err, data) {
                            lessons = data;
                            insertDocsInParallel(dbModels.Users, [
                                {
                                    name: '张三',
                                    city: 'nj'
                                },
                                {
                                    name: '李四',
                                    city: 'bj'
                                }
                            ], function (err, data) {
                                users = data;
                                insertDocsInParallel(dbModels.Practices, [
                                    {
                                        lord: users[0].id,
                                        lesson: lessons[0].id,
                                        times: 1,
                                        num: 10,
                                        lastTimes: 1,
                                        lastNum: 10
                                    },
                                    {
                                        lord: users[0].id,
                                        lesson: lessons[1].id,
                                        endDate: new Date(moment().subtract(1, 'days').valueOf()),
                                        times: 1,
                                        num: 15,
                                        lastTimes: 1,
                                        lastNum: 15,
                                        give: 'give 15'
                                    },
                                    {
                                        lord: users[1].id,
                                        lesson: lessons[0].id,
                                        times: 1,
                                        num: 30,
                                        lastTimes: 1,
                                        lastNum: 30,
                                        give: 'give 30'
                                    },
                                    {
                                        lord: users[1].id,
                                        lesson: lessons[1].id,
                                        endDate: new Date(),
                                        times: 1,
                                        num: 50,
                                        lastTimes: 1,
                                        lastNum: 50,
                                        give: 'give 50'
                                    }
                                ], function (err, data) {
                                    practics = data;
                                    done();
                                })
                            })
                        })
                });

                it('无任何记录', function () {
                    return Practics.listPracticsForTheLessonOfToday(lessons[2]._id)
                        .then(function (data) {
                            expect(data).eqls({
                                total: {count: 0, sum: 0},
                                list: []
                            });
                        })
                });

                it('正确', function () {
                    return Practics.listPracticsForTheLessonOfToday(lessons[1]._id)
                        .then(function (data) {
                            expect(data).eqls({
                                total: {count: 1, times: 1, sum: 50},
                                list: [
                                    {
                                        _id: {
                                            lord: users[1]._id,
                                            give: "give 50",
                                            times: 1,
                                            num: 50,
                                            lastTimes: 1,
                                            lastNum: 50,
                                            time: practics[3].endDate
                                        }
                                    }
                                ]
                            });
                        })
                })
            });

            describe('申报指定用户指定共修项目的修量', function () {
                var practicsData, fields;

                beforeEach(function () {
                    fields = ['state', 'begDate', 'endDate', 'week', 'month', 'year',
                        'give', 'times', 'num', 'lastTimes', 'lastNum',
                        'weekTimes', 'weekNum', 'monthTimes', 'monthNum',
                        'yearTimes', 'yearNum'
                    ];
                    practicsData = {
                        times: 2,
                        num: 100,
                        give: 'any give'
                    };
                    func = require('../server/modules/2.1/Practics').announcePractics;
                    return dbSave(dbModels.Users, {name: 'foo'})
                        .then(function (data) {
                            userid = data._id;
                            return dbSave(dbModels.Lessons, {name: 'foo lesson'})
                        })
                        .then(function (data) {
                            lessonId = data._id;
                        })
                });

                it('用户标识非法', function () {
                    var invalidId = '1234';
                    createObjectIdStub.withArgs(invalidId).returns(Promise.reject(reason));
                    func = proxyquire('../server/modules/2.1/Practics', stubs).announcePractics;
                    return func(invalidId, lessonId, practicsData)
                        .then(function (data) {
                            throw 'failed';
                        })
                        .catch(function (err) {
                            expect(reason).eqls(err);
                        })
                });

                it('功课标识非法', function () {
                    var invalidId = '1234';
                    createObjectIdStub.withArgs(userid).returns(Promise.resolve(ObjectID(userid)));
                    createObjectIdStub.withArgs(invalidId).returns(Promise.reject(reason));
                    func = proxyquire('../server/modules/2.1/Practics', stubs).announcePractics;
                    return func(userid, invalidId, practicsData)
                        .then(function (data) {
                            throw 'failed';
                        })
                        .catch(function (err) {
                            expect(reason).eqls(err);
                        })
                });

                it('座数与修量正负不一致', function () {
                    stubs = [];
                    stubs['@finelets/hyper-rest/app'] = {createErrorReason: createReasonStub};
                    createReasonStub.withArgs(400, "修量申报数据有误!").returns(reason);
                    func = proxyquire('../server/modules/2.1/Practics', stubs).announcePractics;
                    practicsData.times = 2;
                    practicsData.num = -10;
                    return func(userid, lessonId, practicsData)
                        .then(function () {
                            throw 'failed';
                        })
                        .catch(function (err) {
                            expect(err).eqls(reason);
                        })

                });

                it('指定用户不存在', function () {
                    userid = "5872ce00376dfa6b8ad85259";
                    createObjectIdStub.withArgs(userid).returns(Promise.resolve(ObjectID(userid)));
                    createObjectIdStub.withArgs(lessonId).returns(Promise.resolve(ObjectID(lessonId)));
                    createReasonStub.withArgs(404, "The user does't exist!").returns(reason);
                    func = proxyquire('../server/modules/2.1/Practics', stubs).announcePractics;
                    return func(userid, lessonId, practicsData)
                        .then(function (data) {
                            throw 'failed';
                        })
                        .catch(function (err) {
                            expect(reason).eqls(err);
                        })
                });

                it('指定共修项目不存在', function () {
                    lessonId = "abcdce00376dfa6b8ad85259";
                    stubs = [];
                    stubs['@finelets/hyper-rest/app'] = {createErrorReason: createReasonStub};
                    createReasonStub.withArgs(404, "The lesson does't exist!").returns(reason);
                    func = proxyquire('../server/modules/2.1/Practics', stubs).announcePractics;
                    return func(userid, lessonId, practicsData)
                        .then(function (data) {
                            throw 'failed';
                        })
                        .catch(function (err) {
                            expect(reason).eqls(err);
                        })
                });

                it('报座数或修量为负', function () {
                    practicsData.num = 0;
                    practicsData.times = -10;
                    return func(userid, lessonId, practicsData)
                        .then(function (data) {
                            expect(data).null;
                            return dbModels.Practices.find({lord: userid, lesson: lessonId})
                        })
                        .then(function (data) {
                            expect(data.length).eqls(0);
                        })
                });

                it('首次申报', function () {
                    return func(userid, lessonId, practicsData)
                        .then(function (data) {
                            expect(data).not.null;
                            return dbModels.Practices.find({lord: userid, lesson: lessonId}, fields)
                        })
                        .then(function (data) {
                            var now = new Date();
                            expect(data.length).eqls(1);
                            var practics = data[0];
                            expect(practics.begDate).eqls(practics.endDate);
                            expect(practics.begDate.setMilliseconds(0)).eqls(now.setMilliseconds(0));
                            expect(practics.year).eqls(0);
                            expect(practics.month).eqls(0);
                            expect(practics.week).eqls(0);
                            expect(practics.give).eqls("any give");
                            expect(practics.times).eqls(practicsData.times);
                            expect(practics.num).eqls(practicsData.num);
                            expect(practics.lastTimes).eqls(practicsData.times);
                            expect(practics.lastNum).eqls(practicsData.num);
                            expect(practics.weekTimes).eqls(practicsData.times);
                            expect(practics.weekNum).eqls(practicsData.num);
                            expect(practics.monthTimes).eqls(practicsData.times);
                            expect(practics.monthNum).eqls(practicsData.num);
                            expect(practics.yearTimes).eqls(practicsData.times);
                            expect(practics.yearNum).eqls(practicsData.num);
                        })
                });

                it('曾经扣减退出后的首次有效申报', function () {
                    return dbSave(dbModels.Practices, {
                        lord: ObjectID(userid),
                        lesson: ObjectID(lessonId)
                    })
                        .then(function () {
                            return func(userid, lessonId, practicsData)
                        })
                        .then(function (data) {
                            expect(data).not.null;
                            return dbModels.Practices.find({lord: userid, lesson: lessonId}, fields)
                        })
                        .then(function (data) {
                            var now = new Date();
                            expect(data.length).eqls(1);
                            var practics = data[0];
                            expect(practics.begDate).eqls(practics.endDate);
                            expect(practics.begDate.setMilliseconds(0)).eqls(now.setMilliseconds(0));
                            expect(practics.year).eqls(0);
                            expect(practics.month).eqls(0);
                            expect(practics.week).eqls(0);
                            expect(practics.give).eqls("any give");
                            expect(practics.times).eqls(practicsData.times);
                            expect(practics.num).eqls(practicsData.num);
                            expect(practics.lastTimes).eqls(practicsData.times);
                            expect(practics.lastNum).eqls(practicsData.num);
                            expect(practics.weekTimes).eqls(practicsData.times);
                            expect(practics.weekNum).eqls(practicsData.num);
                            expect(practics.monthTimes).eqls(practicsData.times);
                            expect(practics.monthNum).eqls(practicsData.num);
                            expect(practics.yearTimes).eqls(practicsData.times);
                            expect(practics.yearNum).eqls(practicsData.num);
                        })
                });

                it('当日再次申报', function () {
                    var firstTime = new Date();
                    firstTime = new Date(firstTime.setHours(13, 40, 0, 0));
                    return dbSave(dbModels.Practices, {
                        lord: ObjectID(userid), lesson: ObjectID(lessonId),
                        begDate: firstTime, endDate: firstTime,
                        week: 0, month: 0, year: 0,
                        num: 100, times: 2,
                        lastNum: 100, lastTimes: 2,
                        weekNum: 100, weekTimes: 2,
                        monthNum: 100, monthTimes: 2,
                        yearNum: 100, yearTimes: 2,
                        give: 'any ....', state: 'on'
                    })
                        .then(function () {
                            return func(userid, lessonId, practicsData);
                        })
                        .then(function (data) {
                            expect(data).not.null;
                            return dbModels.Practices.find({lord: userid, lesson: lessonId}, fields)
                        })
                        .then(function (data) {
                            expect(data.length).eqls(1);
                            var practics = data[0];
                            var now = new Date();
                            expect(practics.begDate).eqls(firstTime);
                            expect(moment(now).diff(moment(practics.endDate), 'seconds')).eqls(0);
                            expect(practics.year).eqls(0);
                            expect(practics.month).eqls(0);
                            expect(practics.week).eqls(0);
                            expect(practics.give).eqls(practicsData.give);
                            expect(practics.times).eqls(2 + practicsData.times);
                            expect(practics.num).eqls(100 + practicsData.num);
                            expect(practics.lastTimes).eqls(2 + practicsData.times);
                            expect(practics.lastNum).eqls(100 + practicsData.num);
                            expect(practics.weekTimes).eqls(2 + practicsData.times);
                            expect(practics.weekNum).eqls(100 + practicsData.num);
                            expect(practics.monthTimes).eqls(2 + practicsData.times);
                            expect(practics.monthNum).eqls(100 + practicsData.num);
                            expect(practics.yearTimes).eqls(2 + practicsData.times);
                            expect(practics.yearNum).eqls(100 + practicsData.num);
                        })
                });

                it('次日再次申报', function () {
                    var firstTime = new Date(moment().subtract(1, 'days').valueOf());
                    //var firstTime = new Date(2018, 3, 25, 14, 20);
                    return dbSave(dbModels.Practices, {
                        lord: ObjectID(userid), lesson: ObjectID(lessonId),
                        begDate: firstTime, endDate: firstTime,
                        week: 0, month: 0, year: 0,
                        num: 100, times: 2,
                        lastNum: 100, lastTimes: 2,
                        weekNum: 100, weekTimes: 2,
                        monthNum: 100, monthTimes: 2,
                        yearNum: 100, yearTimes: 2,
                        give: 'any ....', state: 'on'
                    })
                        .then(function () {
                            return func(userid, lessonId, practicsData);
                        })
                        .then(function (data) {
                            expect(data).not.null;
                            return dbModels.Practices.find({lord: userid, lesson: lessonId}, fields)
                        })
                        .then(function (data) {
                            expect(data.length).eqls(1);
                            var practics = data[0];
                            var now = new Date();
                            expect(practics.begDate).eqls(firstTime);
                            expect(moment(now).diff(moment(practics.endDate), 'seconds')).eqls(0);
                            expect(practics.year).eqls(0);
                            expect(practics.month).eqls(0);
                            expect(practics.week).eqls(0);
                            expect(practics.give).eqls(practicsData.give);
                            expect(practics.times).eqls(2 + practicsData.times);
                            expect(practics.num).eqls(100 + practicsData.num);
                            expect(practics.lastTimes).eqls(practicsData.times);
                            expect(practics.lastNum).eqls(practicsData.num);
                            expect(practics.weekTimes).eqls(2 + practicsData.times);
                            expect(practics.weekNum).eqls(100 + practicsData.num);
                            expect(practics.monthTimes).eqls(2 + practicsData.times);
                            expect(practics.monthNum).eqls(100 + practicsData.num);
                            expect(practics.yearTimes).eqls(2 + practicsData.times);
                            expect(practics.yearNum).eqls(100 + practicsData.num);
                        })
                });

                it('相隔2周多后再次申报', function () {
                    var firstTime = new Date(moment().subtract(3, 'weeks').add(2, 'days').valueOf());
                    return dbSave(dbModels.Practices, {
                        lord: ObjectID(userid), lesson: ObjectID(lessonId),
                        begDate: firstTime, endDate: firstTime,
                        week: 0, month: 0, year: 0,
                        num: 100, times: 2,
                        lastNum: 100, lastTimes: 2,
                        weekNum: 100, weekTimes: 2,
                        monthNum: 100, monthTimes: 2,
                        yearNum: 100, yearTimes: 2,
                        give: 'any ....', state: 'on'
                    })
                        .then(function () {
                            return func(userid, lessonId, practicsData);
                        })
                        .then(function (data) {
                            expect(data).not.null;
                            return dbModels.Practices.find({lord: userid, lesson: lessonId}, fields)
                        })
                        .then(function (data) {
                            expect(data.length).eqls(1);
                            var practics = data[0];
                            var now = new Date();
                            expect(practics.begDate).eqls(firstTime);
                            expect(moment(now).diff(moment(practics.endDate), 'seconds')).eqls(0);
                            expect(practics.year).eqls(0);
                            expect(practics.month).eqls(0);
                            expect(practics.week).eqls(2);
                            expect(practics.give).eqls(practicsData.give);
                            expect(practics.times).eqls(2 + practicsData.times);
                            expect(practics.num).eqls(100 + practicsData.num);
                            expect(practics.lastTimes).eqls(practicsData.times);
                            expect(practics.lastNum).eqls(practicsData.num);
                            expect(practics.weekTimes).eqls(practicsData.times);
                            expect(practics.weekNum).eqls(practicsData.num);
                            expect(practics.monthTimes).eqls(2 + practicsData.times);
                            expect(practics.monthNum).eqls(100 + practicsData.num);
                            expect(practics.yearTimes).eqls(2 + practicsData.times);
                            expect(practics.yearNum).eqls(100 + practicsData.num);
                        })
                });

                it('相隔2月多后再次申报', function () {
                    var firstTime = new Date(moment().subtract(2, 'months').valueOf());
                    return dbSave(dbModels.Practices, {
                        lord: ObjectID(userid), lesson: ObjectID(lessonId),
                        begDate: firstTime, endDate: firstTime,
                        week: 0, month: 0, year: 0,
                        num: 100, times: 2,
                        lastNum: 100, lastTimes: 2,
                        weekNum: 100, weekTimes: 2,
                        monthNum: 100, monthTimes: 2,
                        yearNum: 100, yearTimes: 2,
                        give: 'any ....', state: 'on'
                    })
                        .then(function () {
                            return func(userid, lessonId, practicsData);
                        })
                        .then(function (data) {
                            expect(data).not.null;
                            return dbModels.Practices.find({lord: userid, lesson: lessonId}, fields)
                        })
                        .then(function (data) {
                            expect(data.length).eqls(1);
                            var practics = data[0];
                            var now = new Date();
                            expect(practics.begDate).eqls(firstTime);
                            expect(moment(now).diff(moment(practics.endDate), 'seconds')).eqls(0);
                            expect(practics.year).eqls(0);
                            expect(practics.month).eqls(2);
                            expect(practics.week).eqls(8);
                            expect(practics.give).eqls(practicsData.give);
                            expect(practics.times).eqls(2 + practicsData.times);
                            expect(practics.num).eqls(100 + practicsData.num);
                            expect(practics.lastTimes).eqls(practicsData.times);
                            expect(practics.lastNum).eqls(practicsData.num);
                            expect(practics.weekTimes).eqls(practicsData.times);
                            expect(practics.weekNum).eqls(practicsData.num);
                            expect(practics.monthTimes).eqls(practicsData.times);
                            expect(practics.monthNum).eqls(practicsData.num);
                            expect(practics.yearTimes).eqls(2 + practicsData.times);
                            expect(practics.yearNum).eqls(100 + practicsData.num);
                        })
                });

                it('相隔1年多后再次申报', function () {
                    var firstTime = new Date(moment().subtract(1, 'years').valueOf());
                    return dbSave(dbModels.Practices, {
                        lord: ObjectID(userid), lesson: ObjectID(lessonId),
                        begDate: firstTime, endDate: firstTime,
                        week: 0, month: 0, year: 0,
                        num: 100, times: 2,
                        lastNum: 100, lastTimes: 2,
                        weekNum: 100, weekTimes: 2,
                        monthNum: 100, monthTimes: 2,
                        yearNum: 100, yearTimes: 2,
                        give: 'any ....', state: 'on'
                    })
                        .then(function () {
                            return func(userid, lessonId, practicsData);
                        })
                        .then(function (data) {
                            expect(data).not.null;
                            return dbModels.Practices.find({lord: userid, lesson: lessonId}, fields)
                        })
                        .then(function (data) {
                            expect(data.length).eqls(1);
                            var practics = data[0];
                            var now = new Date();
                            expect(practics.begDate).eqls(firstTime);
                            expect(moment(now).diff(moment(practics.endDate), 'seconds')).eqls(0);
                            expect(practics.year).eqls(1);
                            expect(practics.month).eqls(12);
                            expect(practics.week).eqls(52);
                            expect(practics.give).eqls(practicsData.give);
                            expect(practics.times).eqls(2 + practicsData.times);
                            expect(practics.num).eqls(100 + practicsData.num);
                            expect(practics.lastTimes).eqls(practicsData.times);
                            expect(practics.lastNum).eqls(practicsData.num);
                            expect(practics.weekTimes).eqls(practicsData.times);
                            expect(practics.weekNum).eqls(practicsData.num);
                            expect(practics.monthTimes).eqls(practicsData.times);
                            expect(practics.monthNum).eqls(practicsData.num);
                            expect(practics.yearTimes).eqls(practicsData.times);
                            expect(practics.yearNum).eqls(practicsData.num);
                        })
                });

                it('申报扣减', function () {
                    var firstTime = new Date(moment().subtract(1, 'days').valueOf());
                    return dbSave(dbModels.Practices, {
                        lord: ObjectID(userid), lesson: ObjectID(lessonId),
                        begDate: firstTime, endDate: firstTime,
                        week: 0, month: 0, year: 0,
                        num: 100, times: 2,
                        lastNum: 100, lastTimes: 2,
                        weekNum: 100, weekTimes: 2,
                        monthNum: 100, monthTimes: 2,
                        yearNum: 100, yearTimes: 2,
                        give: 'any ....', state: 'on'
                    })
                        .then(function () {
                            practicsData.times = -3;
                            practicsData.num = -160;
                            return func(userid, lessonId, practicsData);
                        })
                        .then(function (data) {
                            expect(data).not.null;
                            return dbModels.Practices.find({lord: userid, lesson: lessonId}, fields)
                        })
                        .then(function (data) {
                            expect(data.length).eqls(1);
                            var practics = data[0];
                            expect(practics.begDate).eqls(firstTime);
                            expect(practics.endDate).eqls(firstTime);
                            expect(practics.year).eqls(0);
                            expect(practics.month).eqls(0);
                            expect(practics.week).eqls(0);
                            expect(practics.give).eqls(practicsData.give);
                            expect(practics.times).eqls(0);
                            expect(practics.num).eqls(0);
                            expect(practics.lastTimes).eqls(2);
                            expect(practics.lastNum).eqls(100);
                            expect(practics.weekTimes).eqls(2);
                            expect(practics.weekNum).eqls(100);
                            expect(practics.monthTimes).eqls(2);
                            expect(practics.monthNum).eqls(100);
                            expect(practics.yearTimes).eqls(2);
                            expect(practics.yearNum).eqls(100);
                        })
                });
            })
        });
    });
});
