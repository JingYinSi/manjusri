/**
 * Created by clx on 2016/10/27.
 */
function setStatus(response, code, errMsg){
    response.status(code);
    if(errMsg) response.send(errMsg);
    response.end();
}

module.exports = {
    prepay: function (req, res) {
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
            setStatus(res, 400, "amount is undefined");
            return;
        }
        if (trans.amount <= 0) {
            setStatus(res, 400, "amount is invalid");
            return;
        }
        setStatus(res, 400);
    }
}