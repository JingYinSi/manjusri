var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var UserSchema = new Schema({
    name: String,
    img: String,
    openid: String,
    phone: String,
    addr: String,
    watching: Boolean
});

UserSchema.statics.create = function (obj, callback) {
    var User = mongoose.model('User', UserSchema);
    var model = new User(obj);
    model.save(callback);
};

module.exports = mongoose.model('User', UserSchema);

