import { Upload } from '@aws-sdk/lib-storage';
import { s3 } from '../s3/s3.clients';
import configuration from 'src/config/configuration';

const config = configuration();

const generateFileName = (file: Express.Multer.File) => {
  const name = file.originalname.split('.')[0];
  const ext = file.originalname.split('.').pop();

  const random = Array(16)
    .fill(null)
    .map(() => Math.round(Math.random() * 16).toString(16))
    .join('');

  return `${name}-${Date.now()}-${random}.${ext}`;
};

export const uploadSingleFileToS3 = async (
  file: Express.Multer.File,
  folder: string,
) => {
  const bucket = config.aws.s3Bucket!;
  const region = config.aws.region!;

  const key = `${folder}/${generateFileName(file)}`;

  // 🚀 multipart upload (works for images + videos + large files)
  await new Upload({
    client: s3,
    params: {
      Bucket: bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    },
  }).done();

  return {
    url: `https://${bucket}.s3.${region}.amazonaws.com/${key}`,
    key,
  };
};

export const uploadMultipleFilesToS3 = async (
  files: Express.Multer.File[],
  folder: string,
) => {
  return Promise.all(files.map((file) => uploadSingleFileToS3(file, folder)));
};
