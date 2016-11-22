var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

function validateAmount(val) {
    return val > 0;
}

var VirtueSchema = new Schema({
    lord: {type: Schema.Types.ObjectId, ref: 'User'},
    subject: {type: Schema.Types.ObjectId, required: true, ref: 'Part'},
    num: {type: Number},
    price: {type: Number, validate: [validateAmount, '价格应大于零']},
    amount: {type: Number, validate: [validateAmount, '金额应大于零']},
    giving: String,
    paymentNo: String,
    timestamp: {type: Date, default: Date.now()},
    state: {type: String, required: true, default: 'new'}
});

VirtueSchema.statics.place = function (obj, callback) {
    var data = {
        subject: obj.subject,
        price: obj.price,
        num: obj.num,
        amount: obj.amount,
        giving: obj.giving,
        datetime: Date.now()
    }
    var Virtue = mongoose.model('Virtue', VirtueSchema);
    var model = new Virtue(data);
    model.save(callback);
};

VirtueSchema.statics.pay = function (transId, userId, paymentNo, callback) {
    var Virtue = mongoose.model('Virtue', VirtueSchema);
    Virtue.findById(transId, function (err, virtue) {
        virtue.lord = userId;
        virtue.paymentNo = paymentNo;
        virtue.state = 'payed';
        virtue.save(callback);
    });
};

module.exports = mongoose.model('Virtue', VirtueSchema);

