var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    transform = require('@finelets/hyper-rest').db.mongoDb.transform;

var PartSchema = new Schema({
    type: String,
    name: String,
    desc: String,
    img: String,
    price: Number,
    num: Number,
    sold: {type: Number, default: 0},
    onSale: {type: Boolean, default: false}
}, transform);

// TODO: 没有引用可以删除? ------------------------------------------------

PartSchema.statics.create = function (obj, callback) {
    var Part = mongoose.model('Part', PartSchema);
    var model = new Part(obj);
    model.save(callback);
};

PartSchema.methods.updateNum = function(n){
    this.num -= n;
    this.sold += n;
}
// ------------------------------------------------------------------------------

module.exports = mongoose.model('Part', PartSchema);

