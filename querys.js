/**
 * Created by clx on 2017/3/28.
 */

var byProvicesAndCities = [
    {
        $match: {
            state: 'payed',
            timestamp: {
                $gte: new Date(new Date().setHours(0, 0, 0, 0)),
                $lte: new Date(new Date().setHours(23, 59, 59, 999))
            }
        }
    },
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

db.virtues.aggregate([
    {
        $match: {state: 'payed'}
    },
    {$group: {_id: "$lord", count: {$sum: 1}, sum: {$sum: "$amount"}}},
    {
        $sort: {sum: -1}
    }
]);