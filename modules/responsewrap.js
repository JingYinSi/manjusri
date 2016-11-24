/**
 * Created by clx on 2016/10/24.
 */

function ResponseWrap(res) {
    this.res = res;
}

ResponseWrap.prototype.setError = function (code, msg, err) {
    this.res.status(code);
    if (msg) this.res.statusMessage = msg;
    err ? this.res.send(err) : msg ? this.res.send(msg) : this.res.end();
}

ResponseWrap.prototype.render = function (page, data) {
    this.res.render(page, data);
}

module.exports = function(res){
    return new ResponseWrap(res);
}
