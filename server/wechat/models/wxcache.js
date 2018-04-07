var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    transform = require('@finelets/hyper-rest').db.mongoDb.transform;

var WxCacheSchema = new Schema({
    type: String,
    val: String,
    ref: String,
    timeout: Number,
    refresh: String,
}, transform);

module.exports = mongoose.model('Wxcache', WxCacheSchema);

