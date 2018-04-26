var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    transform = require('@finelets/hyper-rest').db.mongoDb.transform;

var PracticeSchema = new Schema({
    lord: {type: Schema.Types.ObjectId, ref: 'User'},
    lesson: {type: Schema.Types.ObjectId, ref: 'Lesson'},
    begDate: {type: Date, default: Date.now()},
    endDate: {type: Date, default: Date.now()},
    week: {type: Number, default: 0},
    month: {type: Number, default: 0},
    year: {type: Number, default: 0},
    num: {type: Number, default: 0},
    times: {type: Number, default: 0},
    lastNum: {type: Number, default: 0},
    lastTimes: {type: Number, default: 0},
    weekNum: {type: Number, default: 0},
    weekTimes: {type: Number, default: 0},
    monthNum: {type: Number, default: 0},
    monthTimes: {type: Number, default: 0},
    yearNum: {type: Number, default: 0},
    yearTimes: {type: Number, default: 0},
    give: String,
    state: {type: String, default: 'on'}
}, transform);

module.exports = mongoose.model('Practice', PracticeSchema);

