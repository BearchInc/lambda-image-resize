var AWS = require('aws-sdk');
var async = require('async');

var s3 = new AWS.S3();

exports.handler = function (event, context) {
    console.log('event: ' + JSON.stringify(event));

    var obj = {
        'bucket': event.Records[0].s3.bucket.name,
        'bucketOut': event.Records[0].s3.bucket.name + "-out",
        'key': event.Records[0].s3.object.key,
    };

    async.waterfall([
        function download(next) {
            // get Markdown object
            s3.getObject(
                {
                    Bucket: obj.bucket,
                    Key: obj.key
                },
                next);
        },
        function transform(response, next) {
            // convert md -> html
            //var data = marked(String(response.Body));

            next(null, response.Body);
        },
        function upload(data, next) {
            // change file extension
            var newFileName = obj.key.split(".")[0] + "-renamed.png";
            console.log("Uploading data to: " + obj.bucketOut);
            s3.putObject(
                {
                    Bucket: obj.bucketOut,
                    Key: newFileName,
                    Body: data,
                    ContentType: "image/png" // set contentType as HTML
                },
                next);
        }
    ], function (err) {
        if (err) {
            console.error(err);
        } else {
            console.log('Success');
        }
        context.done();
    });

};
