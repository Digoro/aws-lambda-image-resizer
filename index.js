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
        // event: {
        //      key: 'meeting/test.png',
        //      folder: 'meeting-resized',
        //      fit: 'fill' or 'cover' //fill: 비율무시 가로세로 값으로 고정, cover: 비율 유지
        // }
        const { key, folder, fit } = event;
        const sanitizedKey = key.replace(/\+/g, " ");
        const parts = sanitizedKey.split("/");
        const filename = parts[parts.length - 1];
        const extension = filename.split('.')[filename.split('.').length - 1];
        const image = await s3.getObject({ Bucket, Key: key }).promise();
        await Promise.all(
            transforms.map(async item => {
                if (extension !== 'gif') {
                    const option = { width: item.width, fit }
                    if (fit === 'fill') option.height = 600;
                    image.Body = await sharp(image.Body).resize(option).toBuffer();
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