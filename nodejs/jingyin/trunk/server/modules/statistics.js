/**
 * Created by clx on 2017/3/28.
 */
const VirtueSchema = require('../wechat/models/virtue'),
    dateUtils = require('../../modules/utils').dateUtils,
    round = require('../../modules/utils').round,
    mongoose = require('mongoose');

var log4js = require('log4js');
log4js.configure("log4js.conf", {reloadSecs: 300});
var logger = log4js.getLogger();

const sortTemplete = {$sort: {sum: -1}}
const matchStageWithPayedStateAndTheYearMonthDay = function (theYear, theMonth, theDay) {
    var matchLine = {$match: {state: 'payed'}}
    if (theYear) {
        var fromDate = dateUtils.minToday(new Date(theYear, 0, 1));
        var toDate = dateUtils.maxToday(new Date(theYear, 11, 31));
        if (theMonth) {
            if (theDay) {
                var day = new Date(theYear, theMonth - 1, theDay);
                fromDate = dateUtils.minToday(day);
                toDate = dateUtils.maxToday(day);
            } else {
                var thisMonth = new Date(theYear, theMonth - 1, 1);
                fromDate = dateUtils.minThisMonth(thisMonth);
                toDate = dateUtils.maxThisMonth(thisMonth);
            }
        }
        matchLine = {
            $match: {
                state: 'payed',
                timestamp: {
                    $gte: fromDate,
                    $lte: toDate
                }
            }
        }
    }
    return matchLine;
}

const genByProvicesAndCities = function (lines, theYear, theMonth, theDay) {
    var result = {};

    return VirtueSchema.aggregate(lines)
        .then(function (data) {
            data = data[0];
            result = data.total[0];
            delete result._id;
            if (theYear) result.year = theYear;
            if (theMonth) result.month = theMonth;
            if (theDay) result.day = theDay;
            result.provinces = {};

            var provincesData = data.byProvinces;
            var citiesData = data.byCities;
            provincesData.forEach(function (item) {
                var provId = item._id.length > 0 ? item._id[0] : null;
                delete item._id;
                var provVal = provId ? provId : "直辖市";
                var cities = {}
                item.cities = cities;
                result.provinces[provVal] = item;

                citiesData.forEach(function (city) {
                    var cityProv = city._id.province.length > 0 ? city._id.province[0] : null;
                    if (cityProv === provId) {
                        var cityName = city._id.city.length > 0 ? city._id.city[0] : "未知";
                        var newItem = Object.assign({}, city);
                        delete newItem._id;
                        cities[cityName] = newItem;

                    }
                });
            });
            return result;
        });
}
const genTopN = function (lines, top, theYear, theMonth, theDay) {
    var result = {};
    return VirtueSchema.aggregate(lines)
        .then(function (data) {
            data = data[0];
            var lords = data.byLord;
            var details = [];
            var lordsum = 0;
            lords.forEach(function (item) {
                var lorddata = item._id.lord[0];
                var lord = {
                    nickname: lorddata.name,
                    name: lorddata.realname,
                    province: lorddata.province,
                    city: lorddata.city,
                    phone: lorddata.phone,
                    addr: lorddata.addr,
                    email: lorddata.email,
                }
                lordsum += item.sum;
                details.push({lord: lord, count: item.count, sum: item.sum});
            });
            result.details = details;
            var total = data.total[0];
            if (top) result.top = top;
            if (theYear) result.year = theYear;
            if (theMonth) result.month = theMonth;
            if (theDay) result.day = theDay;
            result.count = total.count;
            result.sum = total.sum;
            result.percent = round(lordsum * 100 / total.sum, 2);
            return result;
        });
}
const genEachRangeOfAmount = function (lines, range, theYear, theMonth) {
    var result = {};
    return VirtueSchema.aggregate(lines)
        .then(function (data) {
            data = data[0];
            var idx = 1;
            var buckets = [];
            range.forEach(function (item) {
                var byrange = data["byRange" + idx++];
                if (byrange.length > 0) {
                    var virtues = [];
                    var count = 0;
                    var sum = 0;
                    byrange.forEach(function (obj) {
                        var lorddata = obj._id[0];
                        var virtue = {
                            lord: {
                                nickname: lorddata.name,
                                name: lorddata.realname,
                                province: lorddata.province,
                                city: lorddata.city,
                                phone: lorddata.phone,
                                addr: lorddata.addr,
                                email: lorddata.email,
                            },
                            count: obj.count,
                            sum: obj.sum
                        }
                        count += obj.count;
                        sum += obj.sum;
                        virtues.push(virtue);
                    });
                    var bucketItem = {
                        bucket: item.name(),
                        virtues: virtues,
                        count: count,
                        sum: sum
                    }
                    buckets.push(bucketItem);
                }
            });

            var total = data.total[0];
            result = {
                count: total.count,
                sum: total.sum,
                buckets: buckets
            };
            if (theYear) result.year = theYear;
            if (theMonth) result.month = theMonth;
            return result;
        });
}

module.exports = {
    byYears: function () {
        lines = [
            {"$match": {"state": "payed"}},
            {
                "$facet": {
                    "byYear": [
                        {
                            "$group": {
                                "_id": {"$year": "$timestamp"},
                                "count": {"$sum": 1},
                                "sum": {"$sum": "$amount"}
                            }
                        },
                        {$sort: {_id: 1}}
                    ],
                    "total": [{
                        "$group": {"_id": null, "count": {"$sum": 1}, "sum": {"$sum": "$amount"}}
                    }]
                }
            }];
        var result = {
            count: 0,
            sum: 0,
            years: []
        }
        return VirtueSchema.aggregate(lines)
            .then(function (data) {
                data = data[0];
                if(!data.total.length) return result;

                result = data.total[0];
                delete result._id;

                var years = [];
                data["byYear"].forEach(function (item) {
                    var year = {
                        year: item._id,
                        count: item.count,
                        sum: item.sum
                    }
                    years.push(year);
                });
                result.years = years;

                return result;
            });
    },
    byProvicesAndCities: function (theYear, theMonth, theDay) {
        var matchLine = matchStageWithPayedStateAndTheYearMonthDay(theYear, theMonth, theDay);
        var lines = [
            matchLine,
            {$lookup: {from: "users", localField: "lord", foreignField: "_id", as: "lorddoc"}},
            {$project: {"lorddoc.province": 1, "lorddoc.city": 1, amount: 1, timestamp: 1}},
            {
                $facet: {
                    total: [
                        {
                            $group: {
                                _id: null,
                                count: {$sum: 1}, sum: {$sum: "$amount"}
                            }
                        }
                    ],
                    byProvinces: [
                        {
                            $group: {
                                _id: "$lorddoc.province",
                                count: {$sum: 1}, sum: {$sum: "$amount"}
                            }
                        }
                    ],
                    byCities: [
                        {
                            $group: {
                                _id: {province: "$lorddoc.province", city: "$lorddoc.city"},
                                count: {$sum: 1}, sum: {$sum: "$amount"}
                            }
                        }
                    ]
                }
            }
        ];

        return genByProvicesAndCities(lines, theYear, theMonth, theDay);
    },
    topN: function (top, theYear, theMonth, theDay) {
        var matchLine = matchStageWithPayedStateAndTheYearMonthDay(theYear, theMonth, theDay);
        var lines = [
            matchLine,
            {$lookup: {from: "users", localField: "lord", foreignField: "_id", as: "lorddoc"}},
            {$project: {"lorddoc": 1, amount: 1, timestamp: 1}},
            {
                $facet: {
                    total: [
                        {
                            $group: {
                                _id: null,
                                count: {$sum: 1}, sum: {$sum: "$amount"}
                            }
                        }
                    ],
                    byLord: [
                        {
                            $group: {
                                _id: {lord: "$lorddoc"},
                                count: {$sum: 1}, sum: {$sum: "$amount"}
                            },
                        },
                        sortTemplete,
                        {$limit: top}
                    ]
                }
            }
        ];

        return genTopN(lines, top, theYear, theMonth, theDay);
    },
    eachRangeOfAmount: function (range, theYear, theMonth) {
        var facets = {
            total: [
                {
                    $group: {
                        _id: null,
                        count: {$sum: 1}, sum: {$sum: "$amount"}
                    }
                }
            ],
        }
        var idx = 1;
        range.forEach(function (item) {
            var stages = [
                {
                    $group: {
                        _id: "$lorddoc",
                        count: {$sum: 1}, sum: {$sum: "$amount"}
                    }
                },
                {$match: {sum: item.exp()}},
                sortTemplete
            ];
            facets["byRange" + idx++] = stages;
        });

        var fromDate = dateUtils.minToday(new Date(theYear, 0, 1));
        var toDate = dateUtils.maxToday(new Date(theYear, 11, 31));
        if (theMonth) {
            var thisMonth = new Date(theYear, theMonth - 1, 1);
            fromDate = dateUtils.minThisMonth(thisMonth);
            toDate = dateUtils.maxThisMonth(thisMonth);
        }

        var matchLine = !theYear ? {$match: {state: 'payed'}}
            : {
            $match: {
                state: 'payed',
                timestamp: {
                    $gte: fromDate,
                    $lte: toDate
                }
            }
        }

        var lines = [
            matchLine,
            {$lookup: {from: "users", localField: "lord", foreignField: "_id", as: "lorddoc"}},
            {
                $project: {
                    "lorddoc": 1, amount: 1, timestamp: 1
                }
            },
            {
                $facet: facets
            }
        ];

        return genEachRangeOfAmount(lines, range, theYear, theMonth);
    },
    byMonthesOfTheYear: function (theYear) {
        var lines = [
            {
                $match: {
                    state: 'payed',
                    timestamp: {
                        $gte: dateUtils.minToday(new Date(theYear, 0, 1)),
                        $lte: dateUtils.maxToday(new Date(theYear, 11, 31))
                    }
                }
            },
            {
                $facet: {
                    byMonths: [
                        {
                            $group: {
                                _id: {$month: "$timestamp"},
                                count: {$sum: 1}, sum: {$sum: "$amount"}
                            }
                        }
                    ],
                    byTheYear: [
                        {
                            $group: {
                                _id: theYear,
                                count: {$sum: 1}, sum: {$sum: "$amount"}
                            }
                        }
                    ]
                }
            }
        ];

        var result = {};
        return VirtueSchema.aggregate(lines)
            .then(function (data) {
                data = data[0];
                result = data.byTheYear[0];
                result.year = result._id;
                delete result._id;
                result.monthes = {};

                data.byMonths.forEach(function (item) {
                    result.monthes[item._id] = {count: item.count, sum: item.sum}
                });
                return result;
            });
    },
}