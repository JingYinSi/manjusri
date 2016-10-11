var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var VirtueSchema = new Schema({
    openid: {type: String},
    transType: {type: String},
    amount: {type: Number},
    timestamp: {type: Date, 'default': Date.now()},
    state: {type: String, default: '0'}
});

VirtueSchema.statics.placeVirtue = function (amount, callback) {
    var Virtue = mongoose.model('Virtue', VirtueSchema);
    var model = new Virtue({amount: amount});
    model.save(callback);
};

module.exports = mongoose.model('Virtue', VirtueSchema);

