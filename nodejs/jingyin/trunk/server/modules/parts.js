/**
 * Created by clx on 2016/11/24.
 */
var partModel = require('../wechat/models/part'),
    Promise = require('bluebird');

module.exports = {
    updatePartNum: function (partId, num) {
        return partModel.findById(partId)
            .then(function (part) {
                if (!part) return Promise.reject(new Error('The part ' + partId + ' is not found'));
                part.updateNum(num);
                return part.save();
            });
    },

    listPartsOnSale: function () {
        var results = [];
        return partModel.find({type: 'part', onSale: true})
            .select("name img price num sold")
            .exec()
            .then(function (data) {
                data.forEach(function (item) {
                    results.push(item._doc);
                });
                return results;
            })
    }
};