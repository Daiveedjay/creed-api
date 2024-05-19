/* eslint-disable prettier/prettier */
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateCollaboratorDto {};

export class UpdateCollaboratorDto extends PartialType(CreateCollaboratorDto) {}

export class AddCollaboratorDto {
    @ApiProperty({
        type: String,
        required: true
    })
    @IsNotEmpty()
    @IsString()
    domainId: string

    @ApiProperty({
        enum: ['Admin', 'Member', 'Owner'],
        enumName: 'Roles',
        required: true
    })
    @IsNotEmpty()
    role: Role
}

export enum Role {
    Admin = 'Admin',
    Member = 'Member',
    Owner = 'Owner'
}
