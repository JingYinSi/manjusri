const createEntity = require('@finelets/hyper-rest/db/mongoDb/DbEntity'),
dbModel = require('../db/models/VirtueType'),
entityConfig = {
    schema: dbModel,
    updatables: ['title', 'summary']
}

const entity = createEntity(entityConfig)
module.exports = entity
