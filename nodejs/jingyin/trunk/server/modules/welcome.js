/**
 * Created by clx on 2016/11/3.
 */
var welcomeMsg = [
    {
        title: '静音文殊禅林',
        description: '描述静音文殊禅林',
        picurl: 'http://jingyintemple.top/images/banner.jpg',
        url: 'http://jingyintemple.top/jingyin/manjusri/index'
    },
    {
        title: '欢迎您关注静音文殊禅林-建寺',
        description: '描述-建寺',
        picurl: 'http://jingyintemple.top/images/jiansi.jpg',
        url: 'http://jingyintemple.top/jingyin/manjusri/jiansi'
    },
    {
        title: '欢迎您关注静音文殊禅林-每日一善',
        description: '描述-每日一善',
        picurl: 'http://jingyintemple.top/images/jiansi.jpg',
        url: 'http://jingyintemple.top/jingyin/manjusri/jiansi'
    },
    {
        title: '欢迎您关注静音文殊禅林-随喜功德',
        description: '描述-随喜功德',
        picurl: 'http://jingyintemple.top/images/jiansi.jpg',
        url: 'http://jingyintemple.top/jingyin/manjusri/jiansi'
    }
];
var welcome = function(user, callback){
    callback(null, {
        msg: welcomeMsg
    });
}
module.exports = welcome;