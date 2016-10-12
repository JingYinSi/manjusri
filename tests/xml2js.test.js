/**
 * Created by sony on 2016/9/26.
 */
var js2xmlparser = require('js2xmlparser'),
    XML = require('pixl-xml'),
    assert = require('assert');

describe('pixl-xml', function () {
    it('读取XML字符串', function () {
        var xmlstr = '<xml><ToUserName><![CDATA[gh_03858052afc1]]></ToUserName>'
            +'<FromUserName><![CDATA[o0ghywcUHxUdazzXEBvYPxU1PVPk]]></FromUserName>'
            +'<CreateTime>1476283073</CreateTime>'
            +'<MsgType><![CDATA[event]]></MsgType>'
            +'<Event><![CDATA[subscribe]]></Event>'
            +'<EventKey><![CDATA[]]></EventKey>'
            +'</xml>';
        var doc = XML.parse(xmlstr);
        console.log(doc);
    });
});
