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
    watching: Boolean
});

UserSchema.statics.registerWeixinUser = function (obj, callback) {
    var data = {
        name: obj.nickname,
        openid: obj.openid,
        img: obj.headimgurl,
        city: obj.city,
        province: obj.province,
        sex: obj.sex,
        subscribe: obj.subscribe_time
    }

    var User = mongoose.model('User', UserSchema);
    var model;
    User.findOne({openid: data.openid}, function (err, user) {
        if (!user) {
            model = new User(data);
        } else {
            if(data.name) user.name = data.name;
            if(data.img) user.img = data.img;
            if(data.city) user.city = data.city;
            if(data.province) user.province = data.province;
            if(data.sex) user.sex = data.sex;
            if(data.subscribe) user.subscribe = data.subscribe;
            model = user;
        }
        model.save(callback);
    });
};

UserSchema.statics.create = function (obj, callback) {
    var User = mongoose.model('User', UserSchema);
    var model = new User(obj);
    model.save(callback);
};


module.exports = mongoose.model('User', UserSchema);

