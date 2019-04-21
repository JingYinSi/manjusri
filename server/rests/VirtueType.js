/**
 * Created by clx on 2017/10/13.
 */
const {
    ifMatch,
    ifNoneMatch,
    update,
    findById
} = require('../biz/VirtueTypes');

module.exports = {
    url: '/jingyin/rests/biz/virtueTypes/:id',
    rests: [{
            type: 'read',
            ifNoneMatch,
            handler: findById
        },
        {
            type: 'update',
            ifMatch,
            handler: (id, data) => {
                data.id = id
                return update(data)
            }
        },
        /* {
            type: 'delete',
            conditional: true,
            handler: {
                condition: salesOrders.checkVersion,
                handle: salesOrders.cancelDraft
            }
        } */
    ]
}