import AWS from "aws-sdk";

export async function uploadToS3(file: File) {
  try {
    updateS3Config();

    const s3 = createS3Object();

    const file_key =
      "uploads/" + Date.now().toString() + file.name.replace(" ", "-");

    const params = {
      Bucket: process.env.NEXT_PUBLIC_AWS_BUCKET_NAME!,
      Key: file_key,
      Body: file,
    };

    const upload = s3
      .putObject(params)
      .on("httpUploadProgress", (evt) => {
        console.log(
          "Uploading to S3...",
          parseInt(((evt.loaded / evt.total) * 100).toString())
        );
      })
      .promise();

    await upload.then((data) => {
      console.log("Successfully uploaded to S3", file_key);
    });

    return Promise.resolve({
      file_key,
      file_name: file.name,
    });
  } catch (error) {
    console.log(error);
  }
}

export const updateS3Config = () => {
  AWS.config.update({
    accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY,
    secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS,
  });
};

export const createS3Object = () => {
  return new AWS.S3({
    params: {
      Bucket: process.env.NEXT_PUBLIC_AWS_BUCKET_NAME,
    },
    region: process.env.NEXT_PUBLIC_AWS_REGION,
  });
};

export function getS3Url(file_key: string) {
  return `https://${process.env.NEXT_PUBLIC_AWS_BUCKET_NAME}.s3.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com/${file_key}`;
}
