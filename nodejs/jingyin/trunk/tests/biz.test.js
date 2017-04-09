/**
 * Created by clx on 2017/4/9.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    XML = require('pixl-xml'),
    js2xmlparser = require('js2xmlparser'),
    proxyquire = require('proxyquire');

describe('事务管理系统', function () {
    describe('业务逻辑', function () {
        var ObjectID;
        var bizuserModel;
        var bizuserData, bizusersInDb;
        before(function () {
            bizuserModel = require('../server/biz/models/bizuser');
            bizuserData = require('./data/bizusersdata');
            ObjectID = require('mongodb').ObjectID;
            mongoose.Promise = global.Promise;
            if (!mongoose.connection.db)
                mongoose.connect(dbURI);
        });

        beforeEach(function (done) {
            insertDocsInSequential(bizuserModel, bizuserData.data, function (err, docs) {
                if(!err) bizusersInDb = docs;
                done(err);
            })
        });

        afterEach(function (done) {
            clearDB(done);
        });

        describe('用户注册', function () {
            var bizUsers, username, pwd, avatar;
            beforeEach(function () {
                bizUsers = require('../server/biz/modules/bizusers');
                avatar = "http://placepuppy.it/images/homepage/Beagle_puppy_6_weeks.JPG";
            });

            it('用户已存在', function (done) {
                username = "user1";
                bizUsers.localReg(username, pwd)
                    .then(function (data) {
                        expect(data).is.false;
                        done();
                    });
            });

            it('注册一个新用户', function (done) {
                username = "foo";
                pwd = "foopwd";
                bizUsers.localReg(username, pwd)
                    .then(function (data) {
                        expect(data._id).not.null;
                        expect(data.name).eql(username);
                        expect(data.pwd).eql(pwd);
                        expect(data.avatar).eql(avatar);
                        done();
                    })
            });
        });

        describe('用户认证', function () {
            var bizUsers, username, pwd, avatar;
            beforeEach(function () {
                bizUsers = require('../server/biz/modules/bizusers');
                avatar = "http://placepuppy.it/images/homepage/Beagle_puppy_6_weeks.JPG";
            });

            it('用户不存在', function (done) {
                username = "foo";
                bizUsers.localAuth(username, pwd)
                    .then(function (data) {
                        expect(data).is.false;
                        done();
                    });
            });

            it('密码不匹配', function (done) {
                username = "user1";
                pwd = 'foo';
                bizUsers.localAuth(username, pwd)
                    .then(function (data) {
                        expect(data).is.false;
                        done();
                    });
            });

            it('认证成功', function (done) {
                username = "user1";
                pwd = "userpwd1";
                bizUsers.localAuth(username, pwd)
                    .then(function (data) {
                        expect(data).eql(bizusersInDb[0]._doc);
                        done();
                    })
            });
        });
    });
})