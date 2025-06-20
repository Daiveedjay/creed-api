/* eslint-disable prettier/prettier */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UserSignupDTOType {
  @ApiProperty({
    type: String,
    minLength: 3,
    required: true
  })
  @MinLength(3)
  fullName: string;

  @ApiProperty({
    type: String,
    required: true,
    example: 'john@gmail.com'
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    type: Boolean,
    required: false,
    default: false
  })
  @IsOptional()
  emailVerified?: boolean;

  @ApiProperty({
    type: String,
    minLength: 3,
    required: false
  })
  @IsOptional()
  googleId?: string;

  @ApiProperty({
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  profilePicture?: string;

  @ApiProperty({
    type: String,
    minLength: 6,
    maxLength: 30,
    required: true
  })
  @MinLength(6)
  @MaxLength(30)
  password: string;

  @ApiProperty()
  @IsString()
  // @IsNotEmpty()
  country: string;

  @ApiProperty()
  @IsString()
  // @IsNotEmpty()
  phone: string;

  @ApiProperty({
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  domainName: string;
}

export class UserSigninDTOType {
  @ApiProperty({
    type: String,
    required: true,
    example: 'john@gmail.com'
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    type: String,
    required: true
  })
  @IsNotEmpty()
  password: string;
}

export class PasswordResetDTO {
  @ApiProperty({
    required: true,
    type: String
  })
  @IsNotEmpty()
  password: string;

  @ApiProperty({
    required: true,
    type: String
  })
  @IsNotEmpty()
  otp: string;
}

export class GoogleDto {
  @ApiProperty({
    type: String,
    required: true
  })
  @IsString()
  @IsNotEmpty()
  accessToken: string
}

export class GoogleSignUpDto {
  @ApiProperty({
    type: String,
    required: true
  })
  @IsString()
  @IsNotEmpty()
  accessToken: string
}
