const Users = require('./users'),
    Lessons = require('./lessons'),
    models = require('../../wechat/models/models');

module.exports = function (openid) {
    return Users.findByOpenid(openid)
        .then(function (user) {
            if (!user) return Promise.reject({
                code: 401,
                err: 'the user with openid ' + openid + ' not found!'
            });
            return {
                listLessonDetails: function () {
                    return Lessons.listLessons(user.id);
                }
            }
        })
}