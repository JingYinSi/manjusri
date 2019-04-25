const entity = require('../biz/Transactions'),
    __ = require('underscore')

const list = (query, req) => {
    return entity.search({
            subject: req.params.id
        })
        .then(function (list) {
            return {
                items: list
            }
        })
}

module.exports = {
    url: '/jingyin/rests/manjusri/subject/:id/dailyVirtues',
    transitions: {
        'VirtueType': {
            id: 'params.id'
        }
    },
    rests: [{
            type: 'query',
            element: 'Virtue',
            handler: list
        }
    ]
}