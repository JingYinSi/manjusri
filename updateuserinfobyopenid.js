const mongoose = require('mongoose'),
    Users = require('./server/wechat/models/user'),
    userModule = require('./server/modules/users');

mongoose.Promise = require('bluebird');
//var connStr = 'mongodb://121.41.93.210:27017/jingyin';
var connStr = 'mongodb://121.41.93.210:27017/test';
mongoose.connect(connStr, function (err) {
    if (err) {
        console.log('Mongoose:' + connStr + ' is failed connect!');
    }
});

var db = mongoose.connection;
db.once('open', function () {
    console.log('Mongoose:' + connStr + ' is connected!');
    var count = 0;
    return Users.find()
        .then(function (users) {
            console.log('total ' + users.length + ' users is found!');
            var promise = Promise.resolve();
            users.forEach(function (user) {
                if (!user.name && user.openid) {
                    var n = count++;
                    promise = promise.then(function () {
                        console.log(n + ' users is updated!')
                        return userModule.registerWeixinUser(user.openid);
                    });
                }
            });
            return promise;
        })
        .then(function () {
            return process.exit();
        });
});
