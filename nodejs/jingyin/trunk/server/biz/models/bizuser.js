var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var BizUserSchema = new Schema({
    name: String,
    pwd:String,
    avatar:String,
});

module.exports = mongoose.model('BizUser', BizUserSchema);

