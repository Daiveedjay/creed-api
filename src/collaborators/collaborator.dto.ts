/* eslint-disable prettier/prettier */
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateCollaboratorDto {
    name: string
};

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
        enum: ['admin', 'member'],
        enumName: 'Roles',
        required: true
    })
    @IsNotEmpty()
    role: Role
}

export class JoinCollaboratorDto {
    @ApiProperty({
        type: String,
        required: true
    })
    @IsNotEmpty()
    @IsString()
    inviteCode: string

    @ApiProperty({
        type: String,
        required: true
    })
    @IsNotEmpty()
    @IsString()
    email: string
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