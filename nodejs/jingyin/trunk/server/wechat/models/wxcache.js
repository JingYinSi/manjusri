var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var WxCacheSchema = new Schema({
    type: String,
    val: String,
    ref: String,
    timeout: Number,
});

module.exports = mongoose.model('Wxcache', WxCacheSchema);

