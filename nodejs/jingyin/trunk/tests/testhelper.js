/**
 * Created by sony on 2016/9/26.
 */
var chai = require('chai'),
    sinon = require('sinon'),
    sinonChai = require('sinon-chai');

global.dbURI = 'mongodb://121.41.93.210:27017/test';
global.clearDB = require('mocha-mongoose')(dbURI);

global.expect = chai.expect;
global.sinon = sinon;
chai.use(sinonChai);
