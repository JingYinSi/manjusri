var VirtueModel = require('./models/virtue');
var weapp = require('../../modules/weapp')(({
    appid: "wx76c06da9928cd6c3",
    appsecret: "f4d498d87cf8641b83671a533c3999ec",
    mch_id: "1364986702",
    mch_key: "womendoushiwutaishanjingyinsidet"
}));
module.exports = {
    index: function (req, res) {
        weapp.parseOath2RedirectURL();
        res.render('wechat/accuvirtue');
    },
    //创建日行一善订单
    action: function (req, res) {
        var amount = req.body.amount;

        createNewVirtue(amount, function (virtue) {
            res.writeHead(200, {
                'Content-Type': 'application/json'
            });
            res.end(JSON.stringify({payURL: payURL(virtue._id, "日行一善", amount)}));
        });

        //-----------------------------
        function createNewVirtue(amount, callback) {
            var virtue = new VirtueModel({
                "transType": '1',
                "timestamp": Date.now(),
                "amount": amount,
                "state": "0"
            });
            virtue.save(function (err, newVirtue) {
                console.log(newVirtue);
                console.log(JSON.stringify(newVirtue));
                callback(newVirtue);
            });
        }

        function payURL(transId, transName, amount) {
            var payURL = "http://121.41.93.210/jingyin/manjusri/pay/confirm";
            payURL = payURL + "?transId=" + transId;
            payURL = payURL + "&transName=" + transName;
            payURL = payURL + "&amount=" + amount;
            payURL = encodeURIComponent(payURL);
            return weapp.parseOath2RedirectURL(payURL);
        }
    }
};