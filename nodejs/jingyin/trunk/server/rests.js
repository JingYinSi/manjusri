/**
 * Created by clx on 2016/11/7.
 * rest资源注册。
 */
const querystring = require('querystring');
var urlMap = {
    virtue: '/jingyin/rest/virtues/:id',
    pay: 'http://jingyintemple.top/jingyin/manjusri/pay/confirm'
};
function ResourceRegistry() {
}

ResourceRegistry.URLTemplate = function (urlTemplate) {
    this.urlTemplate = urlTemplate;
    this.pathParams = genPathParams(urlTemplate);

    //-------------------------------
    function genPathParams(urlTemplate) {
        var result = [];
        var parts = urlTemplate.split('/');
        for (var i = 0; i < parts.length; i++) {
            if (parts[i].indexOf(':') === 0) {
                result.push(parts[i]);
            }
        }
        return result;
    }
};

ResourceRegistry.URLTemplate.prototype.expand = function (params) {
    var path = this.genPath(params);
    var query = this.genQuery(params);
    if(query.length>0){
        return path + '?' + query;
    }
    return path;
};

ResourceRegistry.URLTemplate.prototype.genPath = function (params) {
    var result = this.urlTemplate;
    for (var i = 0; i < this.pathParams.length; i++) {
        result = result.replace(this.pathParams[i], params[this.pathParams[i].substr(1)]);
    }
    return result;
};

ResourceRegistry.URLTemplate.prototype.isPathParam = function (param) {
    for (var i = 0; i < this.pathParams.length; i++) {
        if (this.pathParams[i] === ':' + param) {
            return true;
        }
    }
    return false;
};

ResourceRegistry.URLTemplate.prototype.genQuery = function (params) {
    var result = "";
    for (var property in params) {
        if (!this.isPathParam(property)) {
            result += property + '=' + params[property] + "&";
        }
    }
    if (result.length > 0) {
        result = result.substr(0,result.length-1);
    }
    return result;
};

ResourceRegistry.prototype.getLink = function (resourceId, params) {
    var urlTemplate = new ResourceRegistry.URLTemplate(urlMap[resourceId]);
    return urlTemplate.expand(params);
};

module.exports = new ResourceRegistry();