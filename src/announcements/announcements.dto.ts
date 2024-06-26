import { ApiProperty } from "@nestjs/swagger";
import { User } from "@prisma/client";
import { IsArray, IsOptional, IsString } from "class-validator";

export class CreateAnnouncementDto {
  @ApiProperty({
    type: String,
    required: true
  })
  @IsString()
  content: string;

  @ApiProperty({
    isArray: true,
    required: false
  })
  @IsArray()
  @IsOptional()
  mentions: string[];
}
