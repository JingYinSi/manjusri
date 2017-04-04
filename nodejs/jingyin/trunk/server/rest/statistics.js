/**
 * Created by clx on 2017/3/28.
 */
const rangeFactory = require('../../modules/utils').range.create,
    statistics = require('../modules/statistics');

var log4js = require('log4js');
log4js.configure("log4js.conf", {reloadSecs: 300});
var logger = log4js.getLogger();

const top = 10000;
const range = rangeFactory([1000, 5000, 10000, null]);

const checkYear = function (year) {
    return new Date(year, 2, 1).getFullYear() === year * 1;
}

const checkMonth = function (month) {
    return new Date(2107, month - 1, 1).getMonth() + 1 === month * 1;
}

const checkDay = function (month, day) {
    return new Date(2107, month, day).getDate() === day * 1;
}

module.exports = {
    query: function (req, res) {
        var type = req.query.type;
        if (!type)
            return res.status(400).json({error: 'The query parameter[type] is missed!'});
        var controller = statistics[type];
        if (!controller)
            return res.status(400).json({error: "The query parameter[type] is invalide!"});
        var args = [];
        if (type === 'topN') args.push(top);
        if (type === 'eachRangeOfAmount') args.push(range);

        var year = req.query.year;
        if(year && !checkYear(year))
            return res.status(400).json({error: "The value of query parameter[year] is invalide!"});

        var month = req.query.month;
        if(month && !checkMonth(month))
            return res.status(400).json({error: "The value of query parameter[month] is invalide!"});

        var day = req.query.day;
        var today = new Date();
        if (!year && (month || day))  year = today.getFullYear();
        if (!month && day) month = today.getMonth() + 1;

        if(day && !checkDay(month - 1, day))
            return res.status(400).json({error: "The value of query parameter[day] is invalide!"});

        if (year) args.push(year * 1);
        if (month) args.push(month * 1);
        if (day) args.push(day * 1);

        return controller.apply(controller, args)
            .then(function (data) {
                return res.status(200).json(data);
            })
            .catch(function (err) {
                return res.status(500).json(err);
            });
    },
}