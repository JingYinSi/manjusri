const createCollection = require('@finelets/hyper-rest/db/mongoDb/CreateCollection')

const dbModel = createCollection({
    name: 'VirtueType',
    schema: {
        type: String,
        title: String,
        summary: String
    },
    indexes: [{
            index: {
                type: 1
            },
            options: {
                unique: true
            }
        }
    ]
})

module.exports = dbModel
