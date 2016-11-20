/**
 * Created by clx on 2016/11/20.
 */
const VirtueSchema = require('../wechat/models/virtue');

function Virtues() {
}
var virtueListQuery = VirtueSchema
    .find({state: 'payed'})
    //.limit(count)
    .sort({timestamp: -1})
    .populate('lord', 'name')
    .populate('subject', 'name');

Virtues.prototype.listLastVirtues = function (count, callback) {
    var list = [];
    virtueListQuery.limit(count).exec(function (err, virtues) {
        if (err) return callback(err);

        virtues.forEach(function (v) {
            var d = {
                date: v.timestamp,
                lord: v.lord ? v.lord.name : '未知',
                subject: v.subject.name,
                num: v.num,
                amount: v.amount
            };
            list.push(d);
        });
        callback(null, list);
    });
}

module.exports = new Virtues();