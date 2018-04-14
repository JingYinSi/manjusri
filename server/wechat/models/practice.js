var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    transform = require('@finelets/hyper-rest').db.mongoDb.transform;

var PracticeSchema = new Schema({
    lord: {type: Schema.Types.ObjectId, ref: 'User'},
    lesson: {type: Schema.Types.ObjectId, ref: 'Lesson'},
    begDate: Date,
    endDate: {type: Date, default: Date.now()},
    num: {type: Number, default: 0},
    lastNum: {type: Number, default: 0},
    give: String,
    state: {type: String, default: 'on'}
}, transform);

module.exports = mongoose.model('Practice', PracticeSchema);

