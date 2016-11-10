var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var PartSchema = new Schema({
    type: String,
    name: String,
    desc: String,
    img: String,
    price: Number,
    num: Number,
    sold: {type: Number, default: 0},
    onSale: {type: Boolean, default: false}
});

PartSchema.statics.create = function (obj, callback) {
    var Part = mongoose.model('Part', PartSchema);
    var model = new Part(obj);
    model.save(callback);
};

module.exports = mongoose.model('Part', PartSchema);

