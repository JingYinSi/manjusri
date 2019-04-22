const createCollection = require('@finelets/hyper-rest/db/mongoDb/CreateCollection'),
    mongoose = require('mongoose'),
    ObjectId = mongoose.Schema.Types.ObjectId

const dbModel = createCollection({
    name: 'Transaction',
    schema: {
        lord: ObjectId,
        subject: {type: ObjectId, required: true},
        num: Number,
        price: Number,
        amount: {type: Number, required: true},
        giving: String,
        paymentNo: String,
        payed: {
            type: Boolean,
            default: false
        }
    }
})

module.exports = dbModel