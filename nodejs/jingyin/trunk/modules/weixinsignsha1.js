/**
 * Created by clx on 2016/12/1.
 */
var sha1 = require('sha1');
var keyvaluesort = function (data) {
    var keys = new Array();
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
}

module.exports = function (data) {
    var tosign = keyvaluesort(data);
    return sha1(tosign).toLowerCase();
}