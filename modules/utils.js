/**
 * Created by clx on 2016/11/3.
 */
var simpleget = require('simple-get');

module.exports = {
    simpleGetJson: function (url, callback) {
        simpleget.concat(url, function (err, res, buf) {
            //TODO:检查是否出错
            var obj = JSON.parse(buf.toString()); //TODO:这里少一个分号为何测试不能发现错误？
            callback(null, obj);
        });
    },

    dateUtils: {
        maxYestoday: function (day) {
            var theDay = day ? day : new Date();
            return new Date(theDay.setHours(0, 0, 0, 0) - 1);
        },

        minTomorrow: function (day) {
            var theDay = day ? day : new Date();
            return new Date(theDay.setHours(23, 59, 59, 999) + 1);
        },

        minToday: function (day) {
            var theDay = day ? day : new Date();
            return new Date(theDay.setHours(0, 0, 0, 0));
        },

        maxToday: function (day) {
            var theDay = day ? day : new Date();
            return new Date(theDay.setHours(23, 59, 59, 999));
        },

        minThisMonth: function (day) {
            var theDay = day ? day : new Date();
            var thisyear = theDay.getFullYear();
            var thismonth = theDay.getMonth();
            return new Date(thisyear, thismonth, 1);
        },

        maxThisMonth: function (day) {
            var theDay = day ? day : new Date();
            var thisyear = theDay.getFullYear();
            var thismonth = theDay.getMonth();
            return new Date(new Date(thisyear, thismonth + 1, 1) - 1);
        }
    },

    round: function (num, scale) {
        if (!("" + num).includes("e")) {
            return +(Math.round(num + "e+" + scale) + "e-" + scale);
        } else {
            var arr = ("" + num).split("e");
            var sig = ""
            if (+arr[1] + scale > 0) {
                sig = "+";
            }
            return +(Math.round(+arr[0] + "e" + sig + (+arr[1] + scale)) + "e-" + scale);
        }
    },

    range: {
        create: function (rangeArray) {
            var result = [];
            var names = [];
            for (var i = 0; i < rangeArray.length - 1; i++) {
                names.push([rangeArray[i], rangeArray[i + 1]]);
            }
            names.forEach(function (name) {
                var obj = {
                    name: function () {
                        return name;
                    },
                    exp: function () {
                        var exp = {};
                        if (name[0]) exp["$gte"] = name[0];
                        if (name[1]) exp["$lt"] = name[1];
                        return exp;
                    }
                }
                result.push(obj);
            });
            return result;
        }
    }

}
