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
var PATTERN_DATAURL = /^data:.*?base64,(.*)$/;

/**
 * Load files from subsequent filters.
 * @param req {Function}
 * @param res {Function}
 * @param path {string}
 * @param callback {Function}
 */
function loader(req, res, path, callback) {
    var re = path.match(PATTERN_DATAURL);

    if (re) { // Data URL.
        return callback(null, {
            path: path,
            data: new Buffer(re[1], 'base64').toString(),
            mime: 'application/json',
            mtime: Date.now()
        });
    }

    req.url(path)(function (err) {
        if (err) {
            callback(err);
        } else {
            callback(null, {
                path: req.path,
                data: res.toString(),
                mime: res.type()
                    // Set a default MIME.
                    || 'application/octet-stream',
                mtime: new Date(
                        res.head('last-modified')
                        // Set default mtime to now.
                        || Date.now()).getTime()
            });
        }
    });
}

function getOriginalContent(path, loader, callback) {
    var meta = {
        mime: null,
        mtime: 0
    };

    loader(path, function (err, file) {
        if (err) {
            return callback(err);
        }

        if (meta.mime && meta.mime !== file.mime) {
            callback(new Error('Inconsistent MIME type'));
        } else {
            meta.mime = file.mime;
        }

        meta.mtime = Math.max(meta.mtime, file.mtime);

        return callback(null, meta, file.data);
    });
}



function getFigoContent(figoConfigPath, callback) {

    fs.readFile(figoConfigPath, function(err, data) {
        if (err) {
            return callback(err);
        }

        return callback(null, data);
    })

}


function replace(data, replaceto) {
    var fetest = 'FE.test={' + replaceto + '}';
    var fdtest = 'FD.test={' + replaceto + '}';
    var loftytest = 'lofty.test={' + replaceto + '}';

    var content = data.replace(/FE.test=\{.*?\}/g, fetest);

    content = content.replace(/FD.test=\{.*?\}/g, fdtest);
    content = content.replace(/lofty.test=\{.*?\}/g, loftytest);

    return content;
}

module.exports = function(figoConfigPath) {

    return function(req, res) {
        req(function (err) {
            var load = loader.bind(null, req, res);
            var path = req.path;

            var check = function() {
                var ext = Path.extname(path);
                return '.js'.indexOf(ext) !== -1
            };

            if (!check()) {
                return res(err);
            }


            getFigoContent(figoConfigPath || '', function(err, buf) {
                if (err) {
                    return res(err);
                }
                var figoStr = buf.toString();

                getOriginalContent(path, load, function (err, meta, data) {
                    // Restore the original path.
                    req.url(path);

                    var replacedStr = replace(data, figoStr);

                    if (err) {
                        res(err);
                    } else {
                        res.status(200)
                            .head('content-type', meta.mime)
                            .head('last-modified', new Date(meta.mtime)
                                .toGMTString())
                            .data(replacedStr)();
                    }
                });

            })

        });
    };

};
