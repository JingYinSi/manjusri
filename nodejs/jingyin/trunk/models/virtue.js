/**
 * Created by sony on 2016/9/26.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var VirtueSchema = new Schema({
    openid:        {type:  String},
    transType:     {type:  String},
    amount:        {type:  Number},
    timestamp:     {type:Date,     'default':    Date.now()},
    state:     {type:  String}
});
module.exports = mongoose.model('Virtue', VirtueSchema);

