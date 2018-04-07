var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    transform = require('@finelets/hyper-rest').db.mongoDb.transform;

var PracticeSchema = new Schema({
    lord: {type: Schema.Types.ObjectId, ref: 'User'},
    lesson: {type: Schema.Types.ObjectId, ref: 'Lesson'},
    begDate: {type: Date, default: Date.now()},
    endDate: Date,
    num: {type: Number, default: 0},
    state: {type: String, default: 'on'}
}, transform);

module.exports = mongoose.model('Practice', PracticeSchema);

