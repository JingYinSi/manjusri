var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

function validateAmount(val) {
    return val > 0;
}

var VirtueSchema = new Schema({
    trader: {type: String, required: true},
    details: {
        subject: {type: String, required: true},
        num: {type: Number},
        price: {type: Number, validate: [validateAmount, '价格应大于零']}
    },
    amount: {type: Number, validate: [validateAmount, '金额应大于零']},
    giving: String,
    timestamp: {type: Date, 'default': Date.now()},
    state: {type: String, required: true, default: 'new'}
});

VirtueSchema.statics.placeVirtue = function (obj, callback) {
    var Virtue = mongoose.model('Virtue', VirtueSchema);
    var model = new Virtue(obj);
    model.save(callback);
};

VirtueSchema.statics.havePayed = function (transId, callback) {
    var Virtue = mongoose.model('Virtue', VirtueSchema);
    Virtue.findById(transId, function (err, virtue) {
        virtue.state = 'payed';
        virtue.save(callback);
    });
};

module.exports = mongoose.model('Virtue', VirtueSchema);

