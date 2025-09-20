import { Injectable } from '@nestjs/common';
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { v2 as cloudinary } from 'cloudinary';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { DbService } from './db.service';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

@Injectable()
export class AWSService {
  private readonly s3Client = new S3Client({
    region: 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }
  });

  constructor(
    private readonly dbService: DbService
  ) { }

  public async uploadFile(file: Express.Multer.File): Promise<{
    success: boolean,
    url: string,
    key: string,
  }> {
    const buffer = file.buffer
    // const buffer = Buffer.from()

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'uploads' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(buffer);
    }) as any;

    return {
      success: true,
      url: result.secure_url,
      key: result.public_id
    }
  }

  public async deleteFile(userId: string): Promise<{
    success: boolean,
    message: string
  }> {
    try {
      const user = await this.dbService.user.findUnique({
        where: {
          id: userId
        }
      })

      const result = await cloudinary.uploader.destroy(user.profilePictureKey);

      if (result === 'ok') {
        return {
          success: true,
          message: result
        }
      }

      return {
        success: false,
        message: "Failed to delete profile picture"
      }
    } catch (error) {
      console.log(error)
      return {
        success: false,
        message: 'Deleting the picture unsuccessfully'
      }
    }
  }

  public async getUrl(key: string) {
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: key, // The image file name
    });

    return await getSignedUrl(this.s3Client, command);
  }
}

//
//const rearrangedName = encodeURI(file.originalname)
//const key = `profile-pictures/${rearrangedName}`
//const params = {
//  Bucket: process.env.AWS_S3_BUCKET_NAME,
//  Key: key,
//  Body: file.buffer,
//}
//
//try {
//  const command = new PutObjectCommand(params)
//  await this.s3Client.send(command);
//  const url = await this.getUrl(key)
//
//  return {
//    success: true,
//    url,
//    key: key
//  };
//} catch (error) {
//  console.log(error)
//  return {
//    success: false,
//    url: 'Could not save to s3',
//    key: ''
//  }
//}

