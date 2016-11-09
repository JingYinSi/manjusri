/**
 * Created by clx on 2016/10/27.
 */
var virtueModel = require('../wechat/models/virtue'),
    linkages = require('../rests');

function setStatus(response, code, errMsg) {
    response.status(code);
    if (errMsg) response.send(errMsg);
    response.end();
}

function Virtues() {
}

Virtues.prototype.prepay = function (req, res) {
    var obj = req.body;
    var subject = obj.subject;
    if (!subject) {
        setStatus(res, 400, "subject is not defined");
        return;
    }

    var trans = {
        subject: subject,
        amount: Math.round(obj.amount * 100) / 100,
    }
    if (!trans.amount) {
        return setStatus(res, 400, "amount is undefined");
    }
    if (trans.amount <= 0) {
        return setStatus(res, 400, "amount is invalid");
    }

    virtueModel.place(trans, function (err, obj) {
        var selfUrl = linkages.getLink('virtue', {id: obj.id});
        var payUrl = linkages.getLink('payment', {virtue: obj.id});
        var links = {
            self: selfUrl,
            pay: payUrl
        }
        res.links(links);
        res.header('Location', selfUrl);
        res.status(201).json(obj);
    });
};

module.exports = new Virtues();