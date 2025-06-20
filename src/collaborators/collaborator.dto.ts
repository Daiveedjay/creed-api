/* eslint-disable prettier/prettier */
import { APP_PIPE } from '@nestjs/core';
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString } from 'class-validator';

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
  @IsString()
  @IsNotEmpty()
  userToBeModifiedId: string
}

export class RemovingCollaboratorsDto {
  @ApiProperty({
    type: String,
    required: true
  })
  @IsString()
  @IsNotEmpty()
  userToBeRemovedId: string
}

export class InviteEmailsDto extends PartialType(AddCollaboratorDto) {
  @ApiProperty({
    type: String,
    required: true
  })
  @IsArray()
  usersEmails: string[]
}
