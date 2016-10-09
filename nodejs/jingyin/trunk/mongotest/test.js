/**
 * Created by sony on 2016/9/25.
 */
var mongoClient = require('mongodb').MongoClient;
mongoClient.connect('mongodb://121.41.42.159:27017/mongotest', function (err, db) {
    console.log("connect to db");
    var collection = db.collection('testing');
    collection.insert({'title': 'Snowcrash'}, function (err, docs) {
        var inserted = docs.ops;
        console.log(inserted.length + " records inserted.");
        console.log(inserted[0].title + " - " + inserted[0]._id);

        collection.findOne({title:'Snowcrash'}, function (err, doc) {
            console.log(doc._id + " - " + doc.title);
            db.close();
        });
    });
});
