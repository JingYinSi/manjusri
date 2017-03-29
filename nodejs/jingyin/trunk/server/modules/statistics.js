/**
 * Created by clx on 2017/3/28.
 */
const VirtueSchema = require('../wechat/models/virtue'),
    PartSchema = require('../wechat/models/part'),
    dateUtils = require('../../modules/utils').dateUtils,
    mongoose = require('mongoose'),
    Promise = require('bluebird');

var log4js = require('log4js');
log4js.configure("log4js.conf", {reloadSecs: 300});
var logger = log4js.getLogger();

const aggregateProject = [
    {$match: {state: 'payed'}},
    {$lookup: {from: "users", localField: "lord", foreignField: "_id", as: "lorddoc"}},
    {$lookup: {from: "parts", localField: "subject", foreignField: "_id", as: "partdoc"}},
    {
        $project: {
            lord: 1, "lorddoc.name": 1, subject: 1,
            "partdoc.type": 1, "partdoc.name": 1, amount: 1, timestamp: 1
        }
    }
];

const groupTemplete = {
    $group: {
        _id: null,
        count: {$sum: 1}, sum: {$sum: "$amount"}
    }
}

const sortTemplete = {$sort: {sum: -1}}

const facets = {
    $facet: {
        "ByLordsSubjects_MatchDay": [
            {
                $group: {
                    _id: {
                        lord: "$lord",
                        lordname: "$lorddoc.name",
                        subject: "$subject",
                        parttype: "$partdoc.type",
                        partname: "$partdoc.name"
                    },
                    count: {$sum: 1}, sum: {$sum: "$amount"}
                }
            },
            sortTemplete
        ],
        "ByLords_MatchDay": [
            {
                $group: {
                    _id: {
                        lord: "$lord",
                        lordname: "$lorddoc.name"
                    },
                    count: {$sum: 1}, sum: {$sum: "$amount"}
                }
            },
            sortTemplete
        ]
    }
}

function Statistics() {
}

Statistics.prototype.listVirtues = function (options) {
    var lines = aggregateProject.slice();
    lines.push(groupTemplete);

    var result = {}
    return VirtueSchema.aggregate(lines)
        .then(function (data) {
            result.count = data[0].count;
            result.sum = data[0].sum;
            return result;
        });
}

module.exports = new Statistics();