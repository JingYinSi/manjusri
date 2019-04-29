const createEntity = require('@finelets/hyper-rest/db/mongoDb/DbEntity'),
dbModel = require('../db/models/VirtueType'),
entityConfig = {
    schema: dbModel,
    refs: ['project'],
    updatables: ['img', 'name', 'desc', 'target', 'price', 'onAction']
}

const entity = createEntity(entityConfig)
module.exports = entity