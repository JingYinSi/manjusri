/**
 * Created by clx on 2017/4/7.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var PraySchema = new Schema({
    prayer: {type: Schema.Types.ObjectId, ref: 'User'},
    desc: String,
    date: {type: Date, default: Date.now()},
});

module.exports = mongoose.model('Pray', PraySchema);

