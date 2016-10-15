var VirtueModel = require('./models/virtue'),
    routes = require('../routes'),
    weixin = require('../weixin');

/*
var weapp = require('../../modules/weapp')(({
    appid: "wx76c06da9928cd6c3",
    appsecret: "f4d498d87cf8641b83671a533c3999ec",
    mch_id: "1364986702",
    mch_key: "womendoushiwutaishanjingyinsidet"
}));
*/

module.exports = {
    index: function (req, res) {
        res.render('wechat/accuvirtue');
    },
    //创建日行一善订单
    action: function (req, res) {
        var amount = req.body.amount;
        VirtueModel.placeVirtue(amount, function (err, virtue) {
            var trans = {
                transId: virtue._id,
                transName: '日行一善',
                amount: amount
            };
            routes.sendPayUrl(res, trans);
        });
    }
    /*action: function (req, res) {
     var amount = req.body.amount;
     createNewVirtue(amount, function (virtue) {
     res.writeHead(200, {
     'Content-Type': 'application/json'
     });
     res.end(JSON.stringify({payURL: payURL(virtue._id, "日行一善", amount)}));
     });

     //TODO:createNewVirtue改写为通用方法
     //-----------------------------
     function createNewVirtue(amount, callback) {
     var virtue = new VirtueModel({
     "transType": '1',
     "timestamp": Date.now(),
     "amount": amount,
     "state": "0"
     });
     virtue.save(function (err, newVirtue) {
     //TODO:处理virtue.save异常
     //TODO:将console输出改为log4j输出
     console.log(newVirtue);
     console.log(JSON.stringify(newVirtue));
     callback(newVirtue);
     });
     }

     //TODO:交易对象的概念，包含transId,transName,以及一些相关行为
     function payURL(transId, transName, amount) {
     //TODO:var payURL = "/jingyin/manjusri/pay/confirm";
     var payURL = "http://121.41.93.210/jingyin/manjusri/pay/confirm";
     payURL = payURL + "?transId=" + transId;
     payURL = payURL + "&transName=" + transName;
     payURL = payURL + "&amount=" + amount;
     payURL = encodeURIComponent(payURL);
     return weapp.wrapRedirectURLByOath2Way(payURL);
     }
     }*/
};