var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var WxCacheSchema = new Schema({
    type: String,
    val: String,
    timeout: Number,
    timestamp: {type: Date, default: Date.now()},
});

module.exports = mongoose.model('Wxcache', WxCacheSchema);

