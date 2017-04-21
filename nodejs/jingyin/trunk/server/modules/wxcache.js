/**
 * Created by clx on 2017/4/21.
 */
const wxcacheModel = require('../wechat/models/wxcache'),
    Promise = require('bluebird');

const TYPE_ACCESSTOKEN = 'accesstoken';

var log4js = require('log4js');
log4js.configure("log4js.conf", {reloadSecs: 300});
var logger = log4js.getLogger();

module.exports = {
    setAccessToken: function (val, timeout) {
        return wxcacheModel.findOne({type: TYPE_ACCESSTOKEN})
            .then(function (doc) {
                var model;
                if (!doc) {
                    model = new wxcacheModel({
                        type: TYPE_ACCESSTOKEN,
                        val: val,
                        timeout: timeout
                    });
                } else {
                    model = doc;
                    model.val = val;
                    if (timeout) model.timeout = timeout;
                    model.timestamp = Date.now();
                }
                return model.save();
            });
    },

    getAccessToken: function () {
        return wxcacheModel.findOne({type: TYPE_ACCESSTOKEN})
            .then(function (data) {
                if (!data) return null;
                logger.debug("now is " + Date.now() + "------------------ " + data.timestamp.getTime() + data.timeout );
                return Date.now() > data.timestamp.getTime() + data.timeout ? null : data.val;
            });
    }
}