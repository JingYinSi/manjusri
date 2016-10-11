module.exports = {
    wrapRedirectURLByOath2Way: function (redirectUrl) {
        var appid = "wxc93a54d2d6e5b682";//todo:正式公众号暂时未配置网页授权，将来需要删除
        return this.oauth2BaseURL + "?appid="
            + appid + "&redirect_uri="
            + redirect_uri
            + "&response_type=code&scope=snsapi_base#wechat_redirect";
    }
}
