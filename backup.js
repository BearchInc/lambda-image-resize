var AWS = require('aws-sdk');
var async = require('async');

var s3 = new AWS.S3();

exports.handler = function(event, context) {
    console.log('event: ' + JSON.stringify(event));

    var obj = {
        'bucket': event.Records[0].s3.bucket.name,
        'bucketOut': event.Records[0].s3.bucket.name + "-backup",
        'key': event.Records[0].s3.object.key,
    };

    async.waterfall([
        function checkExists(next) {
            s3.headObject({
                'Bucket': obj.bucketOut,
                'Key': obj.key
            }, function(err, data) {
                if (err) {
                    console.log('File does not exist, creating...');
                    next(null, next);
                } else {
                    next('Aborting. File already exists.');
                }
            })
        },
        function copy(next) {
            s3.copyObject({
                Bucket: obj.bucketOut,
                Key: obj.key,
                CopySource: obj.bucket+"/"+obj.key
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
}
