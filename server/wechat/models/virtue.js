var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

function validateAmount (val) {
    return val > 0;
}

var VirtueSchema = new Schema({
    openid: String,
    transType: String,
    amount: { type: Number, validate: [validateAmount, '金额应大于零']},
    timestamp: {type: Date, 'default': Date.now()},
    state: {type: String, required: true, default: 'new'}
});

VirtueSchema.statics.placeVirtue = function (amount, callback) {
    var Virtue = mongoose.model('Virtue', VirtueSchema);
    var model = new Virtue({amount: amount});
    model.save(callback);
};

VirtueSchema.statics.applyVirtue = function (transId, openId, callback) {
    var Virtue = mongoose.model('Virtue', VirtueSchema);
    Virtue.findById(transId, function(err, virtue){
        virtue.openid = openId;
        virtue.state = 'applied';
        virtue.save(callback);
    });
};

module.exports = mongoose.model('Virtue', VirtueSchema);

