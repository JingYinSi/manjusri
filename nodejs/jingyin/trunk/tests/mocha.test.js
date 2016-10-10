/**
 * Created by sony on 2016/9/26.
 */
var wepay = require('../modules/wepay'),
    js2xmlparser = require('js2xmlparser'),
    parseStringToJs = require('xml2js').parseString,
    assert = require('assert');

describe('微信支付', function () {
    it('对参数按照key=value的格式，并按照参数名ASCII字典序排序', function () {
        var data = {
            sss: 1,
            a: 567,
            bbb: 2
        };
        var val = wepay.keyvaluesort(data);
        assert.equal('a=567&bbb=2&sss=1', val);
    });

    it('MD5签名', function () {
        var data = {
            sss: 1,
            a: 567,
            bbb: 2
        };
        var val = wepay.signMD5(data, 'wdfkwjdfkerjgirg');
        assert.equal('399BCE1827E0B40C633C9A5CF892AFE6', val);
    });

    it('SHA1签名', function () {
        var data = {
            sss: 1,
            a: 567,
            bbb: 2
        };
        var val = wepay.signSHA1(data, 'wdfkwjdfkerjgirg');
        assert.equal('7E413C0212F21CF787F45FAD3A0EAC98E0D6CA61', val);
    });

    it('将JSON转为以xml为根的XML', function () {
        var data = {
            sss: 1,
            a: 567,
            bbb: 2
        };
        var val = js2xmlparser.parse("xml", data);
        console.log(val);
    });
    it('读取XML字符串', function() {
        var xmlstr = '<xml><result_code>xxxxxx</result_code><prepay_id><![CDATA[wx201610042139059db09c090a0428534885]]></prepay_id></xml>';
        var json;
        parseStringToJs(xmlstr, function(err, result) {
            assert.equal(null, err);
            json = result;

        });

        //console.log(json);
        var result = json.xml.prepay_id;
        assert.equal('wx201610042139059db09c090a0428534885', result);
    });
});