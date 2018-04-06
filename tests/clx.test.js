/**
 * Created by clx on 2017/10/9.
 */
var proxyquire = require('proxyquire'),
    _ = require('underscore'),
    mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    finelets = require('@finelets/hyper-rest');

describe('Jingyin Manjusri', function () {
    var stubs, err;
    beforeEach(function () {
        stubs = {};
        err = new Error('any error message');
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
            var save = finelets.db.mongoDb.save;

            dataToAdd = {foo: "foo1", fee: "fee1"};
            return save(model, dataToAdd)
                .then(function (data) {
                    expect(data).not.null;
                    return model.find()
                })
                .then(function (data) {
                    expect(data.length).eqls(1);
                })
        });
    });

    it('test', function () {
        //test for remote repo 5
    })
});
