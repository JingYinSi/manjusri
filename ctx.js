/**
 * Created by clx on 2017/4/8.
 */
const wechatLib = require('wechat'),
    wechat = require('./server/wechat/wechat'),
    mongoose = require('mongoose'),
    session = require('express-session'),
    MongoDBStore = require('connect-mongodb-session')(session),
    passport = require('passport'),
    LocalStrategy = require('passport-local'),
    bizUsers = require('./server/biz/modules/bizusers'),
    GoogleStrategy = require('passport-google'),
    promise = require('bluebird');

const mongodb = 'mongodb://shitongming:jIngyIn228793@121.41.93.210:17915/jingyin',
    secret = 'jingyinmanjusriBiz',
    token = 'jingyinManjusri',
    google = {
        appid: "563211417527-b32d57ihordse1o6250l64caqfbb3udn.apps.googleusercontent.com",
        secret: "0POakSd9SpnlEuRQwm0EP1f6"
    };

const log4js = require('log4js');
log4js.configure("log4js.conf", {reloadSecs: 300});
const logger = log4js.getLogger();

module.exports = {
    port: 80,
    env: 'development',

    connectDb: function () {
        mongoose.Promise = promise;
        mongoose.connect(mongodb);
        mongoose.connection.on('open', function () {
            //console.log('Mongoose:' + mongodb + ' is connected!');
        });
    },

    useSession: function (app) {
        var store = new MongoDBStore(
            {
                uri: mongodb,
                collection: 'sessions'
            });

        // Catch errors
        store.on('error', function (error) {
            assert.ifError(error);
            assert.ok(false);
        });

        // Use express session support since OAuth2orize requires it
        app.use(session({
            //cookie: {maxAge: 1000 * 60 * 60 * 24 * 7},// 1 week
            cookie: {maxAge: 1000 * 60 * 60 * 24},// 1 week
            secret: secret || 'super secret for session',
            saveUninitialized: false,
            resave: false,
            store: store
        }));
    },

    usePassport: function (app) {
        /*passport.use('wechat-signup', new GoogleStrategy({
                appId: WECHAT_APP_ID,
                appSecret: WECHAT_APP_SECRET,
                callbackURL: "http://127.0.0.1:3000/auth/wechat/callback"
            },
            function(accessToken, refreshToken, profile, done) {
                User.findOrCreate({ openid: profile.openid }, function (err, user) {
                    return done(err, user);
                });
            }
        ));*/

        // Use the LocalStrategy within Passport to login/"signin" users.
        passport.use('local-signin', new LocalStrategy(
            {passReqToCallback: true}, //allows us to pass back the request to the callback
            function (req, username, password, done) {
                bizUsers.localAuth(username, password)
                    .then(function (user) {
                        if (user) {
                            logger.info("LOGGED IN AS: " + user.name);
                            req.session.success = 'You are successfully logged in ' + user.name + '!';
                            done(null, user);
                        }
                        if (!user) {
                            logger.info("COULD NOT LOG IN");
                            req.session.error = 'Could not log user in. Please try again.'; //inform user could not log them in
                            done(null, user);
                        }
                    })
                    .catch(function (err) {
                        logger.error(err.body);
                    });
            }
        ));

        // Use the LocalStrategy within Passport to register/"signup" users.
        passport.use('local-signup', new LocalStrategy(
            {passReqToCallback: true}, //allows us to pass back the request to the callback
            function (req, username, password, done) {
                bizUsers.localReg(username, password)
                    .then(function (user) {
                        if (user) {
                            logger.info("REGISTERED: " + user.name);
                            req.session.success = 'You are successfully registered and logged in ' + user.name + '!';
                            done(null, user);
                        }
                        if (!user) {
                            logger.info("COULD NOT REGISTER");
                            req.session.error = 'That username is already in use, please try a different one.'; //inform user could not log them in
                            done(null, user);
                        }
                    })
                    .catch(function (err) {
                        logger.error(err.body);
                    });
            }
        ));

        // Passport session setup.
        passport.serializeUser(function(user, done) {
            logger.info("serializing " + user.name);
            done(null, user);
        });

        passport.deserializeUser(function(obj, done) {
            logger.info("deserializing " + obj);
            done(null, obj);
        });

        app.use(passport.initialize());
        app.use(passport.session());
    },

    userMiddlewares: function (app) {
        app.use('/jingyin/wechat', wechatLib(token, wechat));
    },

}
