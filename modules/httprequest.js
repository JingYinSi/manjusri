/**
 * Created by clx on 2016/11/29.
 */
var simpleget = require('simple-get'),
    Promise = require('bluebird');

function HttpRequest(requestor){
    this.requestor = requestor;
}

//TODO:以后直接将simpleget.concat promisfy
HttpRequest.prototype.concat = function(opt){
    var self = this;
    return new Promise(function (resolve, reject) {
        self.requestor.concat(opt, function (err, res, data) {
            if(err) return reject(err);
            return resolve(data, res);
        });
    });
}

module.exports = new HttpRequest(simpleget);