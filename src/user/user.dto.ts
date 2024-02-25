import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class UserUpdateDTOType {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  fullName?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  domainName?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  username?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  jobTitle?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  department?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  location?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  language?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  availableHoursFrom?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  availableHoursTo?: string;

}