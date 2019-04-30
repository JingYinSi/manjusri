const wx = require('../weixin').weixinService,
    logger = require('@finelets/hyper-rest/app/Logger')

function sessUser(req, res) {
    logger.debug('entering WechatUser service ....')
    let code = req.query.code
    if (!code) {
        logger.error('query param code is not contained in request')
        return res.status(400).end()
    }

    return wx.getOpenId(code)
        .then(function (data) {
            const sess = req.session;
            sess.user = {...data};
            logger.debug("session is built, and context of current session is:" + JSON.stringify(sess, null, 2));
            // 
            return res.json(sess.user)
            // return sess.user
            //TODO:全局性地缓存refresh_token，在我的基础资料处可从该全局缓存中获得accesstoken, 以同步用户资料
            //sess.refresh_token = data.refresh_token;

            // return usersModule.findByOpenid(openid);
        })
        /* .then(function (user) {
            if (!user) {
                errCode = 500;
                return wx.weixinService.getUserInfoByOpenIdAndToken(accessToken, openid)
                    .then(function (userInfo) {
                        var data = {
                            name: userInfo.nickname,
                            openid: userInfo.openid,
                            img: userInfo.headimgurl,
                            city: userInfo.city,
                            province: userInfo.province,
                            sex: userInfo.sex,
                            subscribe: userInfo.subscribe_time
                        }
                        return usersModule.registerUser(data)
                            .then(function (user) {
                                return redirects.toProfile(openid, req, res);
                            });
                    });
            } else {
                //TODO:访问微信用户资料补充当前不足的用户信息
                var redirectToUrl = req.session.redirectToUrl;
                return redirectToUrl ? res.redirect(redirectToUrl) :
                    redirects.toHome(req, res);
            }
        }) */
        .catch(function (err) {
            logger.debug("error:" + err);
            res.status(500).end()
        });
}

function testSess (req, res) {
    if (req.session.user) {
        req.session.user.isVisit++;
    } else {
        req.session.user = {isVisit: 1}
        console.log('first set session user: ' + JSON.stringify(req.session, null, 2));
    }
    res.json(req.session.user);
}

module.exports = {
    url: '/jingyin/rests/manjusri/wx/user',
    rests: [{
        type: 'http',
        method: 'get',
        // handler: sessUser
        handler: testSess
    }]
}