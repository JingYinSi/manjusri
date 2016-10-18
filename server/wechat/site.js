/**
 * Created by sony on 2016/10/18.
 */
const fs = require('fs'),
    path = require('path');

module.exports = {
    root: function (req, res) {
        var fn = path.join(__dirname, '../../client/public/MP_verify_tPLubll44fJTGXbX.txt');
        console.log(fn);
        fs.readFile(fn, function(error, content) {
            if (error) {
                res.writeHead(500);
                res.end();
            }
            else {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(content, 'utf-8');
            }
        });
    }
};