const sharp = require("sharp");
const aws = require("aws-sdk");
const s3 = new aws.S3();

const Bucket = "nonunbub";
const transforms = [
    { name: "800", width: 800 },
];

exports.handler = async (event, context, callback) => {
    try {
        console.log(event);
        const { key, folder, option } = event;
        const sanitizedKey = key.replace(/\+/g, " ");
        const parts = sanitizedKey.split("/");
        const filename = parts[parts.length - 1];
        const extension = filename.split('.')[filename.split('.').length - 1];
        const image = await s3.getObject({ Bucket, Key: key }).promise();
        await Promise.all(
            transforms.map(async item => {
                if (extension !== 'gif' || (extension === 'gif' || option.gif)) {
                    image.Body = await sharp(image.Body, { failOnError: false })
                        .rotate()
                        .resize(option.options)
                        .toBuffer();
                }
                return await s3.putObject({
                    Bucket,
                    Body: image.Body,
                    ACL: 'public-read',
                    Key: `${folder}/${filename}`
                }).promise();
            })
        );
        callback(null, {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': '*'
            },
            body: filename
        })
    } catch (err) {
        callback(`이미지 리사이징 실패: ${err}`);
    }
};