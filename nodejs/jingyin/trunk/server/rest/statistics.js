/**
 * Created by clx on 2017/3/28.
 */
const dateUtils = require('../../modules/utils').dateUtils,
    statistics = require('../modules/statistics');

var log4js = require('log4js');
log4js.configure("log4js.conf", {reloadSecs: 300});
var logger = log4js.getLogger();

const queryMap = {
    /*byYears: function (req, res) {
        return statistics.byYears()
            .then(function (data) {
                return res.status(200).json(data);
            })
            .catch(function (err) {
                return res.status(500).json(err);
            });
    },
    byProvicesAndCities: function (req, res) {
        return statistics.byProvicesAndCities()
            .then(function (data) {
                return res.status(200).json(data);
            })
            .catch(function (err) {
                return res.status(500).json(err);
            });
    },*/
}

module.exports = {
    query: function (req, res) {
        var obj = Object.assign({}, req.query);
        logger.debug("it is impossible !!!!!!!!!!: " + req.query.type);
        logger.debug("it is impossible !!!!!!!!!!: " + JSON.stringify(obj));
        logger.debug("it is impossible !!!!!!!!!!: " + obj["type"]);
        var type = obj.type;
        if (!type)
            return res.status(400).json({error: 'The query parameter[type] is missed!'});
        if (!queryMap[type.toLowerCase()])
            return res.ststus(400).json({error: "The query parameter[type] is invalide!"});
        return res.status(500);
    },
}