/**
 * Created by clx on 2017/10/13.
 */
const {
    ifMatch,
    ifNoneMatch,
    update,
    remove,
    findById
} = require('../biz/VirtueTypes');

module.exports = {
    url: '/jingyin/rests/manjusri/virtueTypes/:id',
    transitions: {
        'Virtue': {
            id: 'context.subject'
        }
    },
    rests: [{
            type: 'read',
            ifNoneMatch,
            dataRef: {project: 'Project'},
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
        {
            type: 'delete',
            handler: remove
        }
    ]
}