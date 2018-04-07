var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    transform = require('@finelets/hyper-rest').db.mongoDb.transform;

var LessonSchema = new Schema({
    name: String,
    desc: String,
    img: String,
    unit: {type: String, default: '遍'},
    begDate: Date,
    endDate: {type: Date, default: new Date(3000, 11, 31)},
    target: Number,
    state: {type: String, default: 'open'}
}, transform);

module.exports = mongoose.model('Lesson', LessonSchema);

