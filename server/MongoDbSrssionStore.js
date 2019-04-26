const session = require('express-session'),
    MongoDBStore = require('connect-mongodb-session')(session);

module.exports = function (maxAge) {
    var store = new MongoDBStore(
        {
            uri: process.env.MONGODB,
            collection: process.env.SESSION_COLLECTION || 'sessions'
        });

    // Catch errors
    store.on('error', function (error) {
        assert.ifError(error);
        assert.ok(false);
    });

    return {
        attachTo: function (app) {
            // Use express session support since OAuth2orize requires it
            app.use(session({
                //cookie: {maxAge: 1000 * 60 * 60 * 24 * 7},// 1 week
                //cookie: {maxAge: 1000 * 60 * 60 * 24},// 1 day
                cookie: {maxAge: maxAge || 1000 * 60 * 60 * 24},
                secret: process.env.SESSION_SECRET || 'super secret for session',
                saveUninitialized: true,
                resave: true,
                store: store
            }));
        }
    };
}