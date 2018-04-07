/**
 * Created by clx on 2017/4/7.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    transform = require('@finelets/hyper-rest').db.mongoDb.transform;

var PraySchema = new Schema({
    prayer: {type: Schema.Types.ObjectId, ref: 'User'},
    context: String,
    date: {type: Date, default: Date.now()},
    printed: {type: Boolean, default: false}
}, transform);

module.exports = mongoose.model('Pray', PraySchema);

