const UserModel = require('../../wechat/models/user');

module.exports = {
    findByOpenid: function (openid) {
        return UserModel.findOne({openid: openid})
            .then(function (data) {
                return data ? data.toJSON() : null;
            })
    }
}
