/**
 * Created by clx on 2017/3/28.
 */
db.virtues.aggregate([
    {
        $match: {state: 'payed'}
    },
    {$group: {_id: "$lord", count: { $sum: 1 }, sum: {$sum: "$amount"}}},
    {
        $sort: {sum: -1}
    }
]);