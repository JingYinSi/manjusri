var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    transform = require('@finelets/hyper-rest').db.mongoDb.transform;

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
}, transform);

module.exports = mongoose.model('User', UserSchema);

