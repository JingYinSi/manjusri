const createEntity = require('@finelets/hyper-rest/db/mongoDb/DbEntity'),
dbModel = require('../db/models/Project'),
entityConfig = {
    schema: dbModel,
    updatables: ['title', 'summary', 'onAction']
}

const entity = createEntity(entityConfig)
module.exports = entity
