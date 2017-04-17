/**
 * Created by clx on 2017/4/8.
 */
const prays = require('../modules/prays'),
    path = require('path'),
    mime = require('mime'),
    fs = require('fs'),
    docx = require('../../modules/templeteddocx'),
    linkage = require('../rests');

var log4js = require('log4js');
log4js.configure("log4js.conf", {reloadSecs: 300});
var logger = log4js.getLogger();

module.exports = {
    pray: function (req, res) {
        var lordid = req.params.lordid;
        var prayid = req.params.prayid;
        return prays.findByLordAndId(lordid, prayid)
            .then(function (apray) {
                if (!apray) {
                    return res.status(404).end();
                }
                var selflink = linkage.getLink('lordPray', {lordid: lordid, prayid: prayid});
                var lordlink = linkage.getLink('lord', {id: lordid});
                var result = {
                    data: apray,
                    links: {
                        self: selflink,
                        related: {
                            lord: lordlink
                        }
                    }
                }
                logger.debug("The document response for a pray:" + JSON.stringify(result));
                return res.json(result);
            })
            .catch(function (err) {
                return res.json(500, err);
            });
    },

    add: function (req, res) {
        var lordid = req.params.id;
        var data = req.body;
        logger.debug("We are going to add pray:" + JSON.stringify({
                lordid: lordid,
                pray: data.pray
            }));
        return prays.add(lordid, data.pray)
            .then(function (pray) {
                var selflink = linkage.getLink('lordPrays', {id: lordid});
                var praylink = linkage.getLink('lordPray', {lordid: lordid, prayid: pray._id});
                var lordlink = linkage.getLink('lord', {id: lordid});
                var result = {
                    data: pray,
                    links: {
                        self: selflink,
                        related: {
                            pray: praylink,
                            lord: lordlink
                        }
                    }
                }
                logger.debug("The document response for a pray:" + JSON.stringify(result));
                return res.status(201).json(result);
            })
            .catch(function (err) {
                return res.json(500, err);
            });
    },

    print: function (req, res) {
        var praysToPrint;
        return prays.praysToPrint()
            .then(function (list) {
                if(list.length === 0) return res.status(404).end();

                praysToPrint = {prays: list};
                var date = list[0].date;
                var year = date.getFullYear();
                var month = date.getMonth() + 1;
                var day = date.getDate();
                var time = date.getMilliseconds();
                var fn = '' + year + '-' + month + '-' + day + '-' + time + '.docx';
                logger.debug("generated the file:" + fn);

                docx.instance('../data/praycardtemplate.docx', '../data/upload/prays')
                    .generate(fn, praysToPrint);

                var file = path.join(__dirname, '../../data/upload/prays/' + fn);
                logger.debug("download the file:" + file);
                var filename = path.basename(file);
                var mimetype = mime.lookup(file);

                res.setHeader('Content-disposition', 'attachment; filename=' + filename);
                res.setHeader('Content-type', mimetype);

                var filestream = fs.createReadStream(file);
                filestream.pipe(res);

                return prays.setAllPrinted();
            })
            .then(function (rows) {
                logger.info("" + rows.nModified + "张许愿卡将被打印。。。");
                return;
                //return res.status(200).json(rows);
            })
            .catch(function (err) {
                return res.json(500, err);
            })
    }
}