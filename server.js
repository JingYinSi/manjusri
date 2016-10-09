/**
 * Created by sony on 2016/9/18.
 */
var express = require('express'),
    config = require('./server/configure'),
    app = express(),
    mongoose = require('mongoose');

app.set('port', process.env.PORT || 80);
app.set('views', __dirname + '/views');
app = config(app);
mongoose.connect('mongodb://121.41.93.210:27017/jingyin');
mongoose.connection.on('open', function () {
    console.log('Mongoose connected!');
});
//app.get('/', function (req, res) {
//    res.send('Hello world!!!!');
//});
app.listen(app.get('port'), function () {
    console.log('Server up: http://localhost:' + app.get('port'));
});
