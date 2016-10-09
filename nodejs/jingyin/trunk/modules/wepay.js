/**
 * Created by sony on 2016/10/4.
 */
var md5 = require('MD5'),
    sha1 = require('sha1');

module.exports = {
    keyvaluesort: function (data) {
        var keys = new Array();
        //var index = 0;
        for (var k in data) {
            keys.push(k);
        }

        keys = keys.sort();
        var val = '';
        for (var i = 0; i < keys.length; i++) {
            if (i > 0) val = val + '&';
            val = val + keys[i] + '=' + data[keys[i]];
        }
        return val;
    },

    signMD5: function (data, key) {
        var tosign = this.keyvaluesort(data) + '&key=' + key;
        return md5(tosign).toUpperCase();
    },

    signSHA1: function (data, key) {
        var tosign = this.keyvaluesort(data) + '&key=' + key;
        return sha1(tosign).toUpperCase();
    }
}