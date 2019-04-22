const createCollection = require('@finelets/hyper-rest/db/mongoDb/CreateCollection'),
mongoose = require('mongoose')

const dbModel = createCollection({
    name: 'VirtueType',
    schema: {
        project: mongoose.Schema.Types.ObjectId,
        img: String,
        name: String,
        desc: String,
        target: Number,
        price: Number,
        onAction: {
            type: Boolean,
            default: true
        }
    },
    indexes: [{
            index: {
                project: 1,
                name: 1
            },
            options: {
                unique: true
            }
        }
    ]
})

module.exports = dbModel
