const createCollection = require('@finelets/hyper-rest/db/mongoDb/CreateCollection')

const dbModel = createCollection({
    name: 'User',
    schema: {
        name: String,
        img: String,
        openid: String,
        city: String,
        province: String,
        sex: Number,
        subscribe: Number,
        phone: String,
        addr: String,
        watching: Boolean,
        realname:String,
        email:String
    },
    indexes: [{
            index: {
                openid: 1
            },
            options: {
                unique: true
            }
        }
    ]
})

module.exports = dbModel