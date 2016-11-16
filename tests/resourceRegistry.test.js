/**
 * Created by sony on 2016/9/26.
 */
describe('资源注册', function () {
    var linkage;
    before(function(){
        linkage = require('../server/rests');
    });

    it('getLink', function () {
        expect(linkage.getLink("virtue", {id: 234567})).eql("/jingyin/rest/virtues/234567");
        expect(linkage.getLink("payment", {virtue: 234567}))
            .eql("http://jingyintemple.top/jingyin/manjusri/pay/confirm?virtue=234567");
    });
});
