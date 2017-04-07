var linkages = require("../rests"),
    virtuesModule = require('../modules/virtues'),
    partsModule = require('../modules/parts'),
    createResponseWrap = require('../../modules/responsewrap'),
    usersModule = require('../modules/users'),
    mongoose = require('mongoose'),
    redirects = require('./redirects'),
    wx = require('../weixin');

var log4js = require('log4js');
log4js.configure("log4js.conf", {reloadSecs: 300});
var logger = log4js.getLogger();


//TODO:将manjusriPages.js并入manjusri.js中

var dealwithVirtue = function (type, req, res) {
    var view = type === "daily" ? 'manjusri/dailyVirtue' : 'manjusri/suixi';
    var res = createResponseWrap(res);
    return virtuesModule.lastVirtuesAndTotalCount(type, 30)
        .then(function (data) {
            data.menu = linkages.getMainMenuLinkages();
            return res.render(view, data);
        })
        .catch(function (err) {
            return res.setError(500, null, err);
        });
}

module.exports = {
    home: function (req, res) {
        var viewData = {
            linkages: {
                dailyVirtue: linkages.getLink("dailyVirtue"),
                suixi: linkages.getLink("suixi"),
            },
            menu: linkages.getMainMenuLinkages()
        }
        return res.render('manjusri/index', viewData);
    },

    dailyVirtue: function (req, res) {
        return dealwithVirtue('daily', req, res);
    },

    suixi: function (req, res) {
        return dealwithVirtue('suixi', req, res);
    },

    jiansi: function (req, res) {
        var res = createResponseWrap(res);
        return partsModule.listPartsOnSale()
            .then(function (parts) {
                    var view = {
                        daily: linkages.getLink("dailyVirtue"),
                        suixi: linkages.getLink("suixi"),
                        menu:linkages.getMainMenuLinkages(),
                        parts: []
                    };
                    parts.forEach(function (item) {
                        var link = linkages.getLink("trans", {partId: item._id});
                        delete item._id;
                        item.url = link;
                        view.parts.push(item);
                    })
                    return res.render('manjusri/jiansi', view);
                }, function (err) {
                    return res.setError(500, null, err);
                }
            );
    },

};

