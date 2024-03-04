import AWS from "aws-sdk";
import fs from "fs";
import { createS3Object, updateS3Config } from "./s3";

export async function downloadFromS3(file_key: string) {
  try {
    updateS3Config();
    const s3 = createS3Object();

    const params = {
      Bucket: process.env.NEXT_PUBLIC_AWS_BUCKET_NAME!,
      Key: file_key,
    };

    const obj = await s3.getObject(params).promise();
    const file_name = `/tmp/pdf-${Date.now()}.pdf`;

    fs.writeFileSync(file_name, obj.Body as Buffer);

    return file_name;
  } catch (error) {
    console.error(error);
    return;
  }
}
