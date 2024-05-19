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
        enum: ['admin', 'member', 'owner'],
        enumName: 'Roles',
        required: true
    })
    @IsNotEmpty()
    role: Role
}

export enum Role {
    Admin = 'admin',
    Member = 'member',
    Owner = 'owner'
}
