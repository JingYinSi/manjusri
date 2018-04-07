const Users = require('./users'),
    Lessons = require('./lessons'),
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
                    return Lessons.listLessonPracticesDetails(user.id);
                }
            }
        })
}