/* const wx = require('../weixin').weixinService,
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
        .then(function (user) {
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
        })
        .catch(function (err) {
            logger.debug("error:" + err);
            res.status(500).end()
        });
} */

const jwt = require('jsonwebtoken'),
    wx = require('../weixin').weixinService,
    logger = require('@finelets/hyper-rest/app/Logger')

function auth(req, res) {
    logger.debug('entering Wechat Authentication service ....')
    let code = req.query.code
    if (!code) {
        logger.error('query param code is not contained in request')
        return res.status(400).end()
    }

    return wx.getOpenId(code)
        .then(function (data) {
                logger.debug('wx auth info:' + JSON.stringify(data, null, 2) || 'undefined')
                logger.debug('process.env.JWT_SECRET:' + process.env.JWT_SECRET || 'undefined')
                    const token = jwt.sign(data, process.env.JWT_SECRET)
                    return res.json({token})
                })
            .catch(function (err) {
                logger.error('Fail from wx getopenid: \r\n' + err)
                res.status(500).end()
            });
        }

    module.exports = {
        url: '/jingyin/rests/manjusri/wx/auth',
        rests: [{
            type: 'http',
            method: 'get',
            handler: auth
        }]
    }