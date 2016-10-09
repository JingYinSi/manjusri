/**
 * Created by sony on 2016/9/26.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var SponsorSchema = new Schema({
    id:           {type:  String},
    password:    {type:  String},
    name:       {type:  String},
    timestamp:      {type:Date,     'default':    Date.now()}
});
module.exports = mongoose.model('Sponsor', SponsorSchema);

