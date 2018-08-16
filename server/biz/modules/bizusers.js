/**
 * Created by clx on 2017/4/9.
 */
const userModel = require('../models/bizuser'),
    logger = require('@finelets/hyper-rest/app/Logger');

module.exports = {
    localReg: function (username, password) {
        return userModel.findOne({
                'name': username
            })
            .then(function (result) {
                if (null != result) {
                    logger.info("USERNAME ALREADY EXISTS:", result.name);
                    return false; // username exists
                } else {
                    logger.info("CREATING USER:", username);
                    var user = new userModel({
                        "name": username,
                        "pwd": password,
                        "avatar": "http://placepuppy.it/images/homepage/Beagle_puppy_6_weeks.JPG"
                    });
                    return user.save()
                        .then(function (data) {
                            return data._doc;
                        })
                }
            });
    },

    localAuth: function (username, password) {
        return userModel.findOne({
                'name': username
            })
            .then(function (result) {
                if (!result) {
                    logger.info("USERNAME NOT FOUND:", username);
                    return false;
                } else {
                    logger.info("FOUND USER: " + result.name);
                    if (password === result.pwd) {
                        return result._doc;
                    } else {
                        logger.info("AUTHENTICATION FAILED");
                        return false;
                    }
                }
            });
    }
}