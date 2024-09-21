import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsOptional, IsString, IsBoolean } from "class-validator";

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

  @ApiProperty({
    type: Boolean,
    required: true
  })
  @IsBoolean()
  isAutomated: boolean;
}
