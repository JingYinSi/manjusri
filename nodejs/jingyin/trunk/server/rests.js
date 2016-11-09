/**
 * Created by clx on 2016/11/7.
 */
const querystring = require('querystring');

var urlMap = {
    virtue: '/jingyin/rest/virtues/:id',
    payment: 'http://jingyintemple.top/jingyin/manjusri/pay/confirm'
}
function ResourceRegistry() {
}

ResourceRegistry.prototype.getLink = function (resourceId, params) {
    //TODO:实现通用getlink的算法
    function genericGetLink(resourceId, params) {
        var urlTemplate = urlMap[resourceId];
        var parts = urlTemplate.split('/');
        var result = '';
        var query = {};
        for (var k in params) {
            var s = ':' + k;
            var i;
            for (i = 0; i < parts.length; i++) {
                if (parts[i] === s) {
                    parts[i] = params[k];
                    break;
                }
            }
            if (i === parts.length) query[k] = params[k];
        }
        parts.forEach(function (p) {
            if(p !== '') result += '/' + p;
        });
        result += '?' + querystring.stringify(query);
        return result;
    }
    if(resourceId === 'virtue')
        return '/jingyin/rest/virtues/' + params.id;
    if(resourceId === 'pay')
        return 'http://jingyintemple.top/jingyin/manjusri/pay/confirm?virtue=' + params.virtue;
}

module.exports = new ResourceRegistry();