/**
 * Created by clx on 2017/3/28.
 */
const rangeFactory = require('../../modules/utils').range.create,
    statistics = require('../modules/statistics');

var log4js = require('log4js');
log4js.configure("log4js.conf", {reloadSecs: 300});
var logger = log4js.getLogger();

const top = 20000;
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

const checkTop = function (t) {
    return t > 0;
}

module.exports = {
    index: function (req, res) {
        var data = {
            prayPrint: {
                desc: '打印祈福卡',
                url: 'http://www.jingyintemple.top/jingyin/rests/pray/print'
            },
            statistics: {
                desc: '统计',
                links: {
                    topN: {
                        desc: '按金额从大到小排名',
                        links: {
                            all: {
                                desc: '全部捐助排名',
                                url: 'http://www.jingyintemple.top/jingyin/rests/manjusri/statistics?type=topN',
                            },
                            top40: {
                                desc: '捐助前40名',
                                url: 'http://www.jingyintemple.top/jingyin/rests/manjusri/statistics?type=topN&top=40',
                            },
                            byDateOfThisMonthOfThisYear: {
                                desc: '当年当月指定日的排名，如当年当月22日的排名',
                                url: 'http://www.jingyintemple.top/jingyin/rests/manjusri/statistics?type=topN&day=22'
                            },
                            byMonthOfThisYear: {
                                desc: '当年指定月份的排名，如当年4月份的排名',
                                url: 'http://www.jingyintemple.top/jingyin/rests/manjusri/statistics?type=topN&month=4'
                            },
                            byYear: {
                                desc: '指定年份的排名，如2017年排名',
                                url: 'http://www.jingyintemple.top/jingyin/rests/manjusri/statistics?type=topN&year=2017'
                            },
                            byTheDate: {
                                desc: '指定年月日的排名，如2017年4月20日排名',
                                url: 'http://www.jingyintemple.top/jingyin/rests/manjusri/statistics?type=topN&year=2017&month=4&day=20'
                            },
                        }
                    },
                    byYears: {
                        desc: '各年度及总计',
                        url: 'http://www.jingyintemple.top/jingyin/rests/manjusri/statistics?type=byYears'
                    },
                    byMonthsInTheYear: {
                        desc: '指定年度各月份及总计',
                        url: 'http://www.jingyintemple.top/jingyin/rests/manjusri/statistics?type=byMonthesOfTheYear'
                    },
                    byProvincesAndCities: {
                        desc: '指定年度各省市及总计',
                        url: 'http://www.jingyintemple.top/jingyin/rests/manjusri/statistics?type=byProvicesAndCities'
                    },
                    byRanks: {
                        desc: '指定年度各金额区间及总计',
                        url: 'http://www.jingyintemple.top/jingyin/rests/manjusri/statistics?type=eachRangeOfAmount'
                    },
                }
            }
        };
        return res.status(200).json(data);
    },

    query: function (req, res) {
        var type = req.query.type;
        if (!type)
            return res.status(400).json({error: 'The query parameter[type] is missed!'});
        var controller = statistics[type];
        if (!controller)
            return res.status(400).json({error: "The query parameter[type] is invalide!"});
        var args = [];
        if (type === 'topN') {
            var topNum = req.query.top;
            topNum = topNum ? topNum * 1 : top;
            if (!checkTop(topNum))
                return res.status(400).json({error: "The value of query parameter[top] is invalide!"});
            args.push(topNum);
        }
        if (type === 'eachRangeOfAmount') args.push(range);

        var year = req.query.year;
        if (year && !checkYear(year))
            return res.status(400).json({error: "The value of query parameter[year] is invalide!"});

        var month = req.query.month;
        if (month && !checkMonth(month))
            return res.status(400).json({error: "The value of query parameter[month] is invalide!"});

        var day = req.query.day;
        var today = new Date();
        if (!year && (month || day))  year = today.getFullYear();
        if (!month && day) month = today.getMonth() + 1;

        if (day && !checkDay(month - 1, day))
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