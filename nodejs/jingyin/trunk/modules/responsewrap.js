/**
 * Created by clx on 2016/10/24.
 */
module.exports = function (res) {
    this.response = res;
    this.setStatus = function (code, message) {
        this.response.status(code);
        if(message) this.response.statusMessage = message;
        this.response.end();
    }
    return this;
}