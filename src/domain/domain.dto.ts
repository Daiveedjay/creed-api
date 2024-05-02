/* eslint-disable prettier/prettier */
import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsOptional, MinLength } from "class-validator";


export class CreateDomainDTO {
  @ApiProperty({
    minLength: 3,
    required: true,
  })
  @MinLength(3)
  name: string;

  // @ApiProperty({
  //   isArray: true,
  //   required: false
  // })
  // @IsOptional()
  // @IsArray()
  // domainMembers: string[];
}

// UPDATE DOMAIN DTO SECTION 
export class UpdateDefaultDomainDTO {
  @ApiProperty()
  @MinLength(3)
  domainID: string;
}