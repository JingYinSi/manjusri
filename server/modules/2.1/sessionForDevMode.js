const defaultOpenIdForTest = 'o0ghywcfW_2Dp4oN-7NADengZAVM';

module.exports = function () {
    return {
        getOpenId: function () {
            return process.env.OPENID ? process.env.OPENID : defaultOpenIdForTest
        }
    }
}