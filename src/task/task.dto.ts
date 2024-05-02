import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';
export class CreateTaskDTO {
  @ApiProperty()
  @IsString()
  @MinLength(3)
  text: string;

  @ApiProperty()
  @MinLength(5)
  @IsString()
  description: string;

  @ApiProperty()
  subTasks: string[];

  @ApiProperty()
  @IsString()
  statusId: string;
}
