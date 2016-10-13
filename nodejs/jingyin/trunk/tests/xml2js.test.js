/**
 * Created by sony on 2016/9/26.
 */
var js2xmlparser = require('js2xmlparser'),
    parseStringToJs = require('xml2js').parseString,
    assert = require('assert');

describe('xml2js', function () {
    it('读取XML字符串', function () {
        var xmlstr = '<xml><ToUserName><![CDATA[gh_03858052afc1]]></ToUserName>'
            +'<FromUserName><![CDATA[o0ghywcUHxUdazzXEBvYPxU1PVPk]]></FromUserName>'
            +'<CreateTime>1476283073</CreateTime>'
            +'<MsgType><![CDATA[event]]></MsgType>'
            +'<Event><![CDATA[subscribe]]></Event>'
            +'<EventKey><![CDATA[]]></EventKey>'
            +'</xml>';
        var json;
        parseStringToJs(xmlstr, function (err, result) {
            assert.equal(null, err);
            console.log(JSON.stringify(result));
        });
    });
});
