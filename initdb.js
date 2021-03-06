/**
 * Created by clx on 2016/11/1.
 */
const connectMongoDb = require('@finelets/hyper-rest/db/mongoDb/ConnectMongoDb'),
    dbSave = require("@finelets/hyper-rest/db/mongoDb/SaveObjectToDb"),
    ObjectID = require('mongodb').ObjectID,
    logger = require('@finelets/hyper-rest/app/Logger'),
    _ = require('underscore'),
    moment = require('moment'),
    dbModel = require('../../wechat/models');

if(process.argv.length < 3) return;
const connstr = process.argv[2];
connectMongoDb(function () {

}, connstr);

const mongoose = require('mongoose'),
    Part = require('./server/wechat/models/part');

/*var connStr = 'mongodb://121.41.93.210:17914/jingyin';
 mongoose.connect(connStr, function (err) {
    if(err) {
        console.log('Mongoose:' + connStr + ' is failed connect!');
    }
});*/

var db = mongoose.connection;
db.once('open', function() {
    console.log('Mongoose:' + connStr + ' is connected!');
    Part.create({
        type: 'daily',
        name: '每日一善',
        img: '/images/product_banner2.jpg',
        onSale: true
    }, function (err, part) {
        if(!err) console.log('每日一善 is added to db');
    });
    Part.create({
        type: 'suixi',
        name: '随喜',
        onSale: true
    }, function (err, part) {
        if(!err) console.log('随喜 is added to db');
    });
    Part.create({
        type: 'part',
        name: '万尊文殊菩萨像小',
        img: '/images/product2.jpg',
        price: 0.1,
        num: 5600,
        sold: 1900,
        onSale: false
    }, function (err, part) {
        if(!err) console.log('万尊文殊菩萨像小 is added to db');
    });
    Part.create({
        type: 'part',
        name: '万尊文殊菩萨像中',
        img: '/images/product3.jpg',
        price: 0.11,
        num: 5100,
        sold: 1300,
        onSale: false
    }, function (err, part) {
        if(!err) console.log('万尊文殊菩萨像中 is added to db');
    });
    Part.create({
        type: 'part',
        name: '五方文殊菩萨像',
        img: '/images/product4.jpg',
        price: 0.12,
        num: 4500,
        sold: 1000,
        onSale: false
    }, function (err, part) {
        if(!err) console.log('五方文殊菩萨像 is added to db');
        db.close(function () {
            console.log('db connection is closed!');
        });
    });

});



