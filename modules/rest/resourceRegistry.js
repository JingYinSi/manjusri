/**
 * Created by clx on 2017/4/8.
 */
var __resources = [];

module.exports = {
    register: function (resources) {
        resources.forEach(function (resource) {
            var obj = {
                attachTo : function (app) {
                    app.get(resource.url, resource.handler);
                }
            }
            __resources.push(obj);
        });
    },

    attachTo: function (app) {
        __resources.forEach(function (resource) {
            resource.attachTo(app);
        });
    }
}

