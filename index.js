/**
 * Created by dongming on 14-9-25.
 */

/**
 * js文件的figo支持
 * 解决盖娅环境中，替换js文件中的
 * FE.test={},FD.test={},lofty.test={}
 * dongming.jidm
 */

'use strict';

var Path = require('path');
var fs = require('fs');

var rFE = /FE.test=\{.*?\}/g;
var rFD = /FD.test=\{.*?\}/g;
var rLOFTY = /lofty.test=\{.*?\}/g;

function getFigoContent(figoConfigPath, callback) {

    fs.readFile(figoConfigPath, function(err, data) {
        if (err) {
            return callback(err);
        }

        return callback(null, data);
    })

}

function check(path, data) {
    var ext = Path.extname(path);

    var isFE = rFE.test(data);
    var isFD = rFD.test(data);
    var isLOFTY = rLOFTY.test(data);

    rFE.lastIndex = 0;
    isFD.lastIndex = 0;
    isLOFTY.lastIndex = 0;


    return ('.js'.indexOf(ext) !== -1) && (isFE || isFD || isLOFTY);
}


function replace(data, replaceto) {
    var fetest = 'FE.test={' + replaceto + '}';
    var fdtest = 'FD.test={' + replaceto + '}';
    var loftytest = 'lofty.test={' + replaceto + '}';

    var content = data.replace(rFE, fetest);

    content = content.replace(rFD, fdtest);
    content = content.replace(rLOFTY, loftytest);

    return content;
}

module.exports = function(figoConfigPath) {

    return function(req, res) {
        // disable cache
        req.head('if-modified-since', '');
        req.head('if-none-match', '');

        req(function (err) {
            var path = req.path;
            var orignalData = res.toString();

            if (!check(path, orignalData)) {
                return res(err);
            }

            getFigoContent(figoConfigPath || '', function(err, buf) {
                if (err) {
                    return res(err);
                }
                var figoStr = buf.toString();
                var replacedStr = replace(orignalData, figoStr);

                res.status(200)
                    .head('content-type', 'application/javascript')
                    .head('last-modified', new Date(Date.now()).toGMTString())
                    .data(replacedStr)();

            })

        });
    };

};
