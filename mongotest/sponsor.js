/**
 * Created by sony on 2016/9/26.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

mongoose.connect('mongodb://121.41.42.159:27017/manjusri');
mongoose.connection.on('open', function () {
    console.log('mongoose connected!');
});
mongoose.connection.on('close', function () {
    console.log('mongoose closed!');
});

var Sponsor = new Schema({
    id:           {type:  String},
    password:    {type:  String},
    name:       {type:  String},
    timestamp:      {type:Date,     'default':    Date.now()}
});

var SponsorModel = mongoose.model('Sponsor', Sponsor);
var newSponsor = new SponsorModel({
    id: "0001",
    password: "9",
    name:"吴海燕"
});
newSponsor.save();

SponsorModel.find({}, function (err, sponsors) {
    console.log(sponsors.length);
    for(var i=0; i<sponsors.length; i++){
        console.log('_id: ' + sponsors[i]._id + '\n\r');
        console.log('id: ' + sponsors[i].id + '\n\r');
        console.log('name: ' + sponsors[i].name + '\n\r');
        console.log('time: ' + sponsors[i].timestamp + '\n\r');
    }
    mongoose.connection.close();
});
