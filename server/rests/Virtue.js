
const {
    ifMatch,
    ifNoneMatch,
    update,
    remove,
    findById
} = require('../biz/Transactions');

module.exports = {
    url: '/jingyin/rests/manjusri/virtues/:id',
    rests: [{
        type: 'read',
        ifNoneMatch,
        dataRef: {subject: 'VirtueType'},
        handler: findById
    },
    {
        type: 'update',
        ifMatch,
        handler: (id, data) => {
            data.id = id
            return update(data)
        }
    }]
}