/**
 * Created by clx on 2017/4/21.
 */
const wxcacheModel = require('../wechat/models/wxcache'),
    Promise = require('bluebird'),
    logger = require('@finelets/hyper-rest/app/Logger');

const TYPE_ACCESSTOKEN = 'accesstoken';
const TYPE_TicketForJsAPI = 'TicketForJsAPI';

const __setAccessToken = function (type, val, timeout, ref) {
    var condition = {
        type: type
    };
    //if(ref) condition.ref = ref;
    return wxcacheModel.findOne(condition)
        .then(function (doc) {
            var model;
            if (!doc) {
                var data = {
                    type: type,
                    val: val,
                    timeout: Date.now() + timeout,
                    ref: ref
                };
                model = new wxcacheModel(data);
            } else {
                model = doc;
                model.val = val;
                model.ref = ref;
                model.timeout = Date.now() + timeout;
            }
            return model.save();
        });
};

const __getAccessToken = function (type, ref) {
    var condition = {
        type: type
    };
    if (ref) condition.ref = ref;
    return wxcacheModel.findOne(condition)
        .then(function (data) {
            if (!data) return null;
            var isTimeout = Date.now() > data.timeout;
            if (isTimeout)
                logger.debug("the " + type + " is timeout ......");
            else
                logger.debug("the " + type + " is obtained successfully!");
            return isTimeout ? null : data.val;
        });
}

module.exports = {
    setAccessToken: function (val, timeout) {
        return __setAccessToken(TYPE_ACCESSTOKEN, val, timeout);
    },

    getAccessToken: function () {
        return __getAccessToken(TYPE_ACCESSTOKEN);
    },

    setTicketForJsAPI: function (token, val, timeout) {
        return __setAccessToken(TYPE_TicketForJsAPI, val, timeout, token);
    },

    getTicketForJsAPI: function (token) {
        return __getAccessToken(TYPE_TicketForJsAPI, token);
    }
}