/**
 * Created by sony on 2016/9/26.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
mongoose.connect('mongodb://121.41.42.159:27017/mongotest');
mongoose.connection.on('open', function () {
    console.log('mongoose connected!');
});
var Account = new Schema({
    username:           {type: String, required:    true},
    date_created:       {type: Date,    default:    Date.now()},
    visits:             {type: Number,      default:    0},
    active:             {type:  Boolean,     default:    false},
    age:                {type:  Number, required:    true, min: 13, max: 120}
});
Account.statics.findByAgeRange = function (min, max, callback) {
    this.find({age: {$gt: min, $lte: max}}, callback);
};

var AccountModel = mongoose.model('Account', Account);
var newUser = new AccountModel({username: 'radomUser1', age: 35});

console.log(newUser.username);
console.log(newUser.date_created);
console.log(newUser.visits);
console.log(newUser.active);

newUser.save();
AccountModel.find({}, function (err, accounts) {
    console.log(accounts.length);
    console.log(accounts[0].username);
    mongoose.connection.close();
});

AccountModel.findByAgeRange(34, 36, function (err, accounts) {
    console.log(accounts.length);
    console.log(accounts[0].username);
    mongoose.connection.close();
});
