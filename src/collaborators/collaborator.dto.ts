/* eslint-disable prettier/prettier */
import { APP_PIPE } from '@nestjs/core';
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateCollaboratorDto {
  name: string
};

export class UpdateCollaboratorDto extends PartialType(CreateCollaboratorDto) { }

export class AddCollaboratorDto {
  @ApiProperty({
    type: String,
    required: true
  })
  @IsNotEmpty()
  @IsString()
  domainId: string

  @ApiProperty({
    enum: ['admin', 'member'],
    enumName: 'Roles',
    required: true
  })
  @IsNotEmpty()
  role: 'admin' | 'member'
}

export class JoinCollaboratorDto {
  @ApiProperty({
    type: String,
    required: true
  })
  @IsString()
  @IsNotEmpty()
  domainId: string;

  @ApiProperty({
    type: String,
    required: true
  })
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    enum: ['admin', 'member'],
    enumName: 'Roles',
    required: true
  })
  @IsNotEmpty()
  role: 'admin' | 'member';

  @ApiProperty({
    type: String,
    required: true
  })
  @IsString()
  @IsNotEmpty()
  invitedBy: string;


  @ApiProperty({
    required: true,
    type: Date
  })
  @IsNotEmpty()
  expiredAt: Date;
}

export class CollaboratorsDto {
  @ApiProperty({
    type: String,
    required: true
  })
  @IsNotEmpty()
  @IsString()
  domainId: string
}

export enum Role {
  Admin = 'admin',
  Member = 'member',
}

export class DemotingAndPromotingCollaboratorsDto {
  @ApiProperty({
    enum: ['promoting', 'demoting'],
    enumName: 'Action',
    required: true
  })
  @IsNotEmpty()
  action: 'promoting' | 'demoting'

  @ApiProperty({
    type: String,
    required: true
  })
  userToBePromotedId: string
}
