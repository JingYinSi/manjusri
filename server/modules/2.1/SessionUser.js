const Users = require('./users'),
    Practics = require('./Practics'),
    createErrorReason = require('@finelets/hyper-rest/app').createErrorReason;

module.exports = function (openid) {
    return Users.findByOpenid(openid)
        .then(function (user) {
            if (!user) {
                var reason = createErrorReason(404, 'the user with openid ' + openid + ' not found!');
                return Promise.reject(reason);
            }
            return {
                user: user,
                listLessonDetails: function () {
                    return Practics.listDetails(user.id);
                }
            }
        })
}