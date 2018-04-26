const Promise = require('bluebird'),
    dbModels = require('../../wechat/models'),
    createObjectId = require('@finelets/hyper-rest/db/mongoDb/CreateObjectId');

module.exports = {
    findById: function (id, fields) {
        return createObjectId(id)
            .then(function (data) {
                return dbModels.Lessons.findById(data, fields);
            })
            .then(function (data) {
                if (data == null) return null;
                return data.toJSON();
            })
    },

    listOpeningLessons: function (fields) {
        var result = [];
        return dbModels.Lessons.find({state: 'open'})
            .select(fields)
            .exec()
            .then(function (list) {
                list.forEach(function (data) {
                    result.push(data.toJSON());
                });
                return result;
            })
    }
}