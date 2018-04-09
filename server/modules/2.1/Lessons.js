const Promise = require('bluebird'),
    dbModels = require('../../wechat/models'),
    createErrorReason = require('@finelets/hyper-rest/app').createErrorReason,
    createObjectId = require('@finelets/hyper-rest/db/mongoDb/CreateObjectId');

module.exports = {
    findById: function (id, fields) {
        return createObjectId(id)
            .then(function (data) {
                return dbModels.Lessons.findById(data, fields);
            })
            .then(function (data) {
                if(data == null) return null;
                return data.toJSON();
            })
    }
}