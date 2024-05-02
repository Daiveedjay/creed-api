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
  @ApiProperty()
  @MinLength(3)
  fullName: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
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
  @ApiProperty()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsNotEmpty()
  password: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean;
}

export class PasswordResetDTO {
  @ApiProperty()
  @IsNotEmpty()
  password: string;


  @ApiProperty()
  @IsNotEmpty()
  otp: string;
}
