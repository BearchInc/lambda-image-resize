var gm = require('gm').subClass({
    imageMagick: true
});
var AWS = require('aws-sdk');
var async = require('async');

var s3 = new AWS.S3();

exports.resize = function(event, context) {
    console.log('event: ' + JSON.stringify(event));
    var obj = {
        'bucket': event.Records[0].s3.bucket.name,
        'bucketOut': 'cgcdn',
        'key': event.Records[0].s3.object.key,
    };

    var ext = "*";

    async.waterfall([
        function download(next) {
            s3.getObject({
                Bucket: obj.bucket,
                Key: obj.key
            }, next);
        },
        function transform(response, next) {
            var name = event.Records[0].s3.object.key;
            var list = name.split('.');
            if(list.length >= 2) {
                ext = list[list.length - 1];
            } else {
                ext = undefined;
            }

            console.log('File extension ' + ext);

            if (ext === "png" || ext === "jpeg" || ext === "jpg") {
                gm(response.Body).size(function(err, size) {
                    var biggestDimension = Math.max(size.width, size.height);
                    if (biggestDimension <= 640) {
                        next('Image is alreayd smaller than 640 pixels');
                    } else {
                        var scaleFactor = 640/biggestDimension;
                        var width = size.width * scaleFactor;
                        var height = size.height * scaleFactor;
                        this.resize(width, height).toBuffer('PNG', function(err, buffer) {
                            next(null, buffer);
                        });
                    }
                });
            } else {
                next('format ' + ext + ' not supported');
            }
        },
        function upload(data, next) {
            var newFileName = obj.key;
            console.log("Uploading data to: " + obj.bucketOut);

            s3.putObject({
                    Bucket: obj.bucketOut,
                    Key: newFileName,
                    Body: data,
                    ContentType: "image/" + ext,
                    ACL: 'public-read-write'
                },
                next);
        }
    ], function(err) {
        if (err) {
            console.error(err);
        } else {
            console.log('Success');
        }
        context.done();
    });

};
