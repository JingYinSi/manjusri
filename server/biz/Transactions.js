const createEntity = require('@finelets/hyper-rest/db/mongoDb/DbEntity'),
dbModel = require('../db/models/Transaction'),
entityConfig = {
    schema: dbModel,
    updatables: ['lord', 'paymentNo', 'payed']
}

const entity = createEntity(entityConfig)
module.exports = entity
