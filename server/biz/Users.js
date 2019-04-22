const createEntity = require('@finelets/hyper-rest/db/mongoDb/DbEntity'),
    dbModel = require('../db/models/User'),
    entityConfig = {
        schema: dbModel,
        updatables: ['name', 'img', 'city', 'province', 'sex', 'subscribe', 'phone',
            'addr', 'watching', 'realname', 'email'
        ]
    }

const entity = createEntity(entityConfig)
module.exports = entity