import { Injectable } from '@nestjs/common';
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { DbService } from './db.service';

@Injectable()
export class AWSService {
  private readonly s3Client = new S3Client({
    region: 'us-east-1'
  });
  constructor(
    private readonly dbService: DbService
  ) { }

  public async uploadFile(file: Express.Multer.File, userId: string): Promise<{
    success: boolean,
    url: string,
    key: string
  }> {
    const key = `profile-pictures/${userId}/${file.originalname}`
    const uploader = new Upload({
      client: this.s3Client,
      params: {
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: key,
        Body: file.buffer,
        CacheControl: "max-age=86400",
        ContentType: file.mimetype,
      }
    })

    const putObjectCommand = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      ACL: 'public-read', // or 'private' depending on your use case
      CacheControl: "max-age=86400",
      ContentType: file.mimetype,
    })

    try {
      await uploader.done()
      const url = await getSignedUrl(
        this.s3Client,
        putObjectCommand,
        { expiresIn: 60 * 60 } // 60 seconds
      );

      return {
        success: true,
        url: url.split("?")[0],
        key: key
      };
    } catch (error) {
      console.log(error)
      return {
        success: false,
        url: 'Could not save to s3',
        key: ''
      }
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
}

