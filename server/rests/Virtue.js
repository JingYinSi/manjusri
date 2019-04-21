
const logger = require('@finelets/hyper-rest/app/Logger')

const handler = function (req, res) {
    return Promise.resolve({name: 'this is a daily virtue', id: req.params['id']})
};

module.exports = {
    url: '/jingyin/rests/manjusri/virtues/:id',
    rests: [{
        type: 'read',
        handler: handler
    }]
}