/**
 * Created by clx on 2016/11/24.
 */
var partModel = require('../wechat/models/part'),
    Promise = require('bluebird');

function Parts() {
}

Parts.prototype.updatePartNum = function (partId, num) {
    return partModel.findById(partId)
        .then(function (part) {
            if(!part) return Promise.reject(new Error('The part ' + partId + ' is not found'));
            part.updateNum(num);
            return part.save();
        });
}

module.exports = new Parts();