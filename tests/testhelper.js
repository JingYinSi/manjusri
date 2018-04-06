/**
 * Created by sony on 2016/9/26.
 */
var chai = require('chai'),
    sinon = require('sinon'),
    chaiXml = require('chai-xml'),
    sinonChai = require('sinon-chai');

var sinonStubPromise = require('sinon-stub-promise');
sinonStubPromise(sinon);

global.dbURI = 'mongodb://localhost/test';
global.clearDB = require('./clearDB')(dbURI);

global.expect = chai.expect;
global.sinon = sinon;
chai.use(chaiXml);
chai.use(sinonChai);

global.insertDocsInSequential = function insertDocsInSequential(model, docs, callback) {
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
global.insertDocsInParallel = function insertDocsInParallel(model, docs, callback) {
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
global.createPromiseStub = function createPromiseStub(withArgs, resolves, err) {
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