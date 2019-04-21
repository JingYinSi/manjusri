const __ = require('underscore'),
    linkages = require("../rests"),
    virtuesModule = require('../modules/virtues'),
    createResponseWrap = require('../../modules/responsewrap'),
    wx = require('../weixin'),
    logger = require('@finelets/hyper-rest/app/Logger');

function dealwithVirtue(type, req, res) {
    var view, viewdata, selflink, share;
    if (type === "daily") {
        view = 'manjusri/dailyVirtue';
        selflink = linkages.getLink('dailyVirtue');
        share = {
            title: '日行一善', // 分享标题
            desc: '捐助五台山静音寺建设，圆满福慧资粮！', // 分享描述
            link: wx.weixinConfig.wrapUrlWithSitHost(linkages.getLink('dailyVirtue')), // 分享链接
            imgUrl: wx.weixinConfig.getShareLogoImage(), // 分享图标
        };
    } else {
        view = 'manjusri/suixi';
        selflink = linkages.getLink('suixi');
        share = {
            title: '随喜五台山静音寺建设', // 分享标题
            desc: '五台山静音寺文殊禅林是以培养僧才为核心，弘扬人间佛教的道场！', // 分享描述
            link: wx.weixinConfig.wrapUrlWithSitHost(linkages.getLink('suixi')), // 分享链接
            imgUrl: wx.weixinConfig.getShareLogoImage(), // 分享图标
        };
    }
    var res = createResponseWrap(res);
    logger.debug("to list last 30 payment records with the type of '" + type + "'...");
    return virtuesModule.lastVirtuesAndTotalCount(type, 30)
        .then(function (data) {
            logger.debug("has listed last 30 payment records with the type of '" + type + "'...");
            logger.debug("going to generate config for share infomation ....");
            viewdata = data;
            viewdata.links = {
                self: selflink,
                prepay: linkages.getLink('prepay'),
            }
            viewdata.share = share;
            viewdata.menu = linkages.getMainMenuLinkages();
            return wx.weixinService.generateShareConfig(wx.weixinConfig.wrapUrlWithSitHost(req.url));
        })
        .then(function (shareConfig) {
            logger.debug("生成分享配置信息成功。");
            viewdata.shareConfig = shareConfig;
            return viewdata;
        })
        .catch(function (err) {
            return res.setError(500, null, err);
        });
}

const handler = function (req, res) {
    return dealwithVirtue('daily', req, res);
};

const prepay = function (data) {
    logger.debug('prepay info: ' + JSON.stringify(data, null, 2))
    return Promise.resolve({...data, id: 12345677})
}

module.exports = {
    url: '/jingyin/rests/manjusri/dailyVirtues',
    rests: [{
            type: 'get',
            handler: handler
        },
        {
            type: 'create',
            target: 'Virtue',
            handler: prepay
        }
    ]
}