/* eslint-disable prettier/prettier */
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { stripVTControlCharacters } from 'util';

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
  domainId: string

  @ApiProperty({
    type: String,
    required: true
  })
  email: string

  @ApiProperty({
    enum: ['admin', 'member'],
    enumName: 'Roles',
    required: true
  })
  role: 'admin' | 'member'

  @ApiProperty({
    required: true
  })
  invitedBy: {
    id: string
    name: string
    jobTitle: string
  }
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
