/**
 * Created by sony on 2016/9/26.
 */
var chai = require('chai'),
    sinon = require('sinon'),
    chaiXml = require('chai-xml'),
    sinonChai = require('sinon-chai');

var sinonStubPromise = require('sinon-stub-promise');
sinonStubPromise(sinon);

//global.dbURI = 'mongodb://121.41.93.210:17914/test';
global.dbURI = 'mongodb://test:tEsT228793@121.41.93.210:17915/test';
//global.dbURI = 'mongodb://localhost/test';
//global.dbURI = 'mongodb://shitongming:jIngyIn228793@121.41.93.210:17914/test';
global.clearDB = require('mocha-mongoose')(dbURI);

global.expect = chai.expect;
global.sinon = sinon;
chai.use(chaiXml);
chai.use(sinonChai);
