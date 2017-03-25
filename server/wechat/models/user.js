var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var UserSchema = new Schema({
    name: String,
    img: String,
    openid: String,
    city: String,
    province: String,
    sex: Number,
    subscribe: Number,
    phone: String,
    addr: String,
    watching: Boolean,
    realname:String,
    email:String
});

module.exports = mongoose.model('User', UserSchema);

