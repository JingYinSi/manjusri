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
                openid: openid,
                user: user,
                // 所有功课的共修情况（包括会话用户本人的实修情况）
                listLessonDetails: function () {
                    return Practics.listDetails(user.id);
                },
                // 指定功课的共修情况（包括会话用户本人的实修情况）
                lessonDetails: function (lessonId) {
                    return Practics.lessonDetails(user.id, lessonId);
                }
            }
        })
}