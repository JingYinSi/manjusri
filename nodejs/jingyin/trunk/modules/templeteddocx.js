/**
 * Created by clx on 2017/4/14.
 */
const JSZip = require('jszip'),
    Docxtemplater = require('docxtemplater'),
    fs = require('fs'),
    path = require('path');

var __templeteName, __outputDir;

module.exports = {
    instance: function (templeteName, outputDir) {
        __templeteName = templeteName;
        __outputDir = outputDir;
        return {
            generate: function (destName, data) {
                //Load the docx file as a binary
                var content = fs
                    .readFileSync(path.resolve(__dirname, __templeteName), 'binary');
                var zip = new JSZip(content);
                var doc = new Docxtemplater();
                doc.loadZip(zip);

                //set the templateVariables
                doc.setData(data);

                try {
                    // render the document (replace all occurences of {first_name} by John, {last_name} by Doe, ...)
                    doc.render()
                }
                catch (error) {
                    var e = {
                        message: error.message,
                        name: error.name,
                        stack: error.stack,
                        properties: error.properties,
                    }
                    console.log(JSON.stringify({error: e}));
                    // The error thrown here contains additional information when logged with JSON.stringify (it contains a property object).
                    throw error;
                }

                var buf = doc.getZip()
                    .generate({type: 'nodebuffer'});

                // buf is a nodejs buffer, you can either write it to a file or do anything else with it.
                fs.writeFileSync(path.resolve(__dirname, __outputDir + "/" + destName), buf);
            }
        }
    }
}