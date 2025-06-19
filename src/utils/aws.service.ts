import { Injectable } from '@nestjs/common';
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { v2 as cloudinary } from 'cloudinary';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { DbService } from './db.service';

@Injectable()
export class AWSService {
  private readonly s3Client = new S3Client({
    region: 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }
  });

  private readonly cloudinaryClient = cloudinary.config({
    cloud_name: 'brownson',
    api_key: '491131249681159',
    api_secret: 'gqwnc-x5_WDwrVk5FvrWWxhKfTk' // Click 'View API Keys' above to copy your API secret
  });

  constructor(
    private readonly dbService: DbService
  ) { }

  public async uploadFile(file: Express.Multer.File): Promise<{
    success: boolean,
    url: string,
    key: string
  }> {
    const uploadRes = await this.cloudinaryClient.v2.uploader
      .upload(file.path, {
        public_id: `${file.filename}`,
        overwrite: true,
        //notification_url: "https://mysite.example.com/notify_endpoint"
      })

    console.log(uploadRes)

    return {
      success: true,
      url: 'Success',
      key: 'key'
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

      const deleteObjectCommand = new DeleteObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: user.profilePictureKey
      })

      await this.s3Client.send(deleteObjectCommand)

      return {
        success: true,
        message: 'Picture successfully deleted!'
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

