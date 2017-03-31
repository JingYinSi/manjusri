/**
 * Created by clx on 2017/3/28.
 */
const VirtueSchema = require('../wechat/models/virtue'),
    dateUtils = require('../../modules/utils').dateUtils,
    mongoose = require('mongoose');

var log4js = require('log4js');
log4js.configure("log4js.conf", {reloadSecs: 300});
var logger = log4js.getLogger();

const sortTemplete = {$sort: {sum: -1}}

const genByProvicesAndCities = function (lines, theYear) {
    var result = {};

    return VirtueSchema.aggregate(lines)
        .then(function (data) {
            data = data[0];
            result = data.total[0];
            delete result._id;
            if (theYear) result.year = theYear;
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
const genTopN = function (lines, top, theYear) {
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
            result.count = total.count;
            result.sum = total.sum;
            result.percent = lordsum * 100 / total.sum;
            return result;
        });
}
const genEachRangeOfAmount = function (lines, range, theYear) {
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
            return result;
        });
}

function Statistics() {
}

Statistics.prototype.byYears = function (options) {
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
    var result = {}
    return VirtueSchema.aggregate(lines)
        .then(function (data) {
            data = data[0];

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
}

Statistics.prototype.byProvicesAndCities = function (theYear) {
    var matchLine = !theYear ? {$match: {state: 'payed'}}
        : {
        $match: {
            state: 'payed',
            timestamp: {
                $gte: dateUtils.minToday(new Date(theYear, 0, 1)),
                $lte: dateUtils.maxToday(new Date(theYear, 11, 31))
            }
        }
    }
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

    return genByProvicesAndCities(lines, theYear);
}

Statistics.prototype.topN = function (top, theYear) {
    var matchLine = !theYear ? {$match: {state: 'payed'}}
        : {
        $match: {
            state: 'payed',
            timestamp: {
                $gte: dateUtils.minToday(new Date(theYear, 0, 1)),
                $lte: dateUtils.maxToday(new Date(theYear, 11, 31))
            }
        }
    }

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

    return genTopN(lines, top, theYear);
}

Statistics.prototype.eachRangeOfAmount = function (range, theYear) {
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

    var matchLine = !theYear ? {$match: {state: 'payed'}}
        : {
        $match: {
            state: 'payed',
            timestamp: {
                $gte: dateUtils.minToday(new Date(theYear, 0, 1)),
                $lte: dateUtils.maxToday(new Date(theYear, 11, 31))
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

    return genEachRangeOfAmount(lines, range, theYear);
}

Statistics.prototype.byMonthesOfTheYear = function (theYear) {
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
}

module.exports = new Statistics();