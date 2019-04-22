const createCollection = require('@finelets/hyper-rest/db/mongoDb/CreateCollection')

const dbModel = createCollection({
    name: 'Project',
    schema: {
        type: String,
        title: String,
        summary: String,
        onAction: {
            type: Boolean,
            default: true
        }
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
