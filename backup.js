var AWS = require('aws-sdk');


var s3 = new AWS.S3();

exports.handler = function(event, context) {
    var obj = {
        'bucket': event.Records[0].s3.bucket.name,
        'bucketOut': event.Records[0].s3.bucket.name + "-backup",
        'key': event.Records[0].s3.object.key,
    };

    async.waterfall([
        function copy(next) {
            // get Markdown object
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
