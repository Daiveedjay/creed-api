/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';
export class UserUpdateDTOType {
  @ApiProperty({
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiProperty({
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiProperty({
    example: '34567890-jhgfghjhkjl',
    type: 'string',
    format: 'binary',
    required: false,
  })
  @IsOptional()
  profilePicture?: Express.Multer.File;

  @ApiProperty({
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  jobTitle?: string;

  @ApiProperty({
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiProperty({
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiProperty({
    type: Date,
    required: false,
  })
  @IsOptional()
  @IsDateString()
  availableHoursFrom?: Date;

  @ApiProperty({
    type: Date,
    required: false,
  })
  @IsOptional()
  @IsDateString()
  availableHoursTo?: Date;
}
