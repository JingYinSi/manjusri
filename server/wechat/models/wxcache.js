var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var WxCacheSchema = new Schema({
    type: String,
    val: String,
    ref: String,
    timeout: Number,
    refresh: String,
});

module.exports = mongoose.model('Wxcache', WxCacheSchema);

