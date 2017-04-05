var linkages = require("../rests"),
    virtuesModule = require('../modules/virtues'),
    Promise = require('bluebird'),
    createResponseWrap = require('../../modules/responsewrap'),
    usersModule = require('../modules/users'),
    mongoose = require('mongoose'),
    redirects = require('./redirects'),
    wx = require('../weixin');

var log4js = require('log4js');
log4js.configure("log4js.conf", {reloadSecs: 300});
var logger = log4js.getLogger();

function listVirtuesAndTotalTimes() {
    return new Promise(function (resolve, reject) {
        var data = {};
        return virtuesModule.listLastVirtues(30)
            .then(function (list) {
                data.virtues = list;
                return Virtue.count({state: 'payed'});
            })
            .then(function (times) {
                data.times = times;
                return resolve(data);
            })
            .catch(function (err) {
                return reject(err);
            });
    });
}

module.exports = {
    login: function (req, res) {
        var errCode = 400;
        var wrapedRes = createResponseWrap(res);
        var code = req.query.code;
        if (!code) {
            return wrapedRes.setError(400);
        }
        var openid, accessToken;

        return wx.weixinService.getOpenId(code)
            .then(function (data) {
                openid = data.openid;
                accessToken = data.access_token;
                var sess = req.session;
                sess.user = {openid: openid, access_token: data.access_token};
                sess.refresh_token = data.refresh_token;
                return usersModule.findByOpenid(openid);
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
                    var redirectToUrl = req.session.redirectToUrl;
                    return redirectToUrl ? res.redirect(redirectToUrl)
                        : redirects.toHome(req, res);
                }
            })
            .catch(function (err) {
                logger.debug("error:" + err);
                return wrapedRes.setError(errCode, null, err);
            });
    },

    home: function (req, res) {
        var viewData = {
            linkages:{
                dailyVirtue: linkages.getLink("dailyVirtue"),
                suixi: linkages.getLink("suixi"),
            }
        }
        return res.render('manjusri/index', viewData);
    },

    dailyVirtue: function (req, res) {
        var res = createResponseWrap(res);
        return virtuesModule.lastVirtuesAndTotalCount(30)
            .then(function (data) {
                return res.render('manjusri/dailyVirtue', data);
            })
            .catch(function (err) {
                return res.setError(500, null, err);
            });
    },

    /*
    jiansi: function (req, res) {
        var data = {
            title: '建寺',
            parts: []
        };
        var res = createResponseWrap(res);
        return Part.find({type: 'part', onSale: true})
            .then(function (parts) {
                    data.parts = parts;
                    return res.render('wechat/jiansi', data);
                }, function (err) {
                    return res.setError(500, null, err);
                }
            );
    },



    suixi: function (req, res) {
        var data = {
            title: '建寺-随喜所有建庙功德'
        };
        var res = createResponseWrap(res);
        return Part.findOne({type: 'suixi', onSale: true})
            .then(function (part) {
                if (!part) return res.setError(500, '随喜相关信息未建立');
                data.part = part;
                return res.render('wechat/suixi', data);
            }, function (err) {
                return res.setError(500, null, err);
            });
    },

    trans: function (req, res) {
        var id = req.params.partId;
        var res = createResponseWrap(res);
        return Part.findById(id)
            .then(function (part) {
                if (!part) {
                    return res.setError(404, 'part ' + id.toString() + ' is not found');
                }
                return res.render('wechat/trans', {
                    title: '建寺-' + part.name,
                    part: part
                });
            }, function (err) {
                return res.setError(500, null, err);
            });
    },

    lordVirtues: function (req, res) {
        var viewdata, virtues;
        var resWrap = createResponseWrap(res);
        var openid = req.session.user.openid;
        //var token = sess.user.access_token;
        var errmsg;
        return usersModule.findByOpenid(openid)
            .then(function (lord) {
                if (!lord) {
                    errmsg = "The User with openid(" + openid + ") not exists?";
                    logger.error(errmsg);
                    return Promise.reject();
                }
                viewdata = {lord: lord};
                return virtuesModule.listLordVirtues(lord._id);
            })
            .then(function (virtues) {
                viewdata.virtues = virtues;
                return res.render('wechat/lordVirtues', viewdata);
            })
            .catch(function (err) {
                logger.debug("error:" + err);
                return resWrap.setError(500, errmsg, err);
            });
    },

    lordProfile: function (req, res) {
        //var resWrap = createResponseWrap(res);
        var openid = req.params.openid;
        if (req.session.user.openid !== openid) {
            return redirects.toHome(req, res);
        }
        return usersModule.findByOpenid(openid)
            .then(function (lord) {
                return res.render('wechat/myProfile', lord);
            })
            .catch(function (err) {
                return resWrap.setError(500, null, err);
            })
    },

    updateLordProfile: function (req, res) {
        var openid = req.params.openid;
        var resWrap = createResponseWrap(res);
        var dataToUpdate = req.body;
        logger.info("dataToUpdate:" + JSON.stringify(dataToUpdate));
        usersModule.updateProfileByOpenid(openid, dataToUpdate)
            .then(function (data) {
                res.status(200);
                return res.end();
            })
            .catch(function (err) {
                return resWrap.setError(500, null, err);
            });
    }*/
};

