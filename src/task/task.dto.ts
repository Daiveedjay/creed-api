/* eslint-disable prettier/prettier */
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsArray, IsString, MinLength } from 'class-validator';
export class CreateTaskDTO {
  @ApiProperty({
    required: true,
    minLength: 3,
  })
  @IsString()
  @MinLength(3)
  text: string;

  @ApiProperty({
    required: true,
    minLength: 5,
  })
  @MinLength(5)
  @IsString()
  description: string;

  @ApiProperty({
    required: true,
    type: Array<SubTasks>
  })
  @IsArray()
  subTasks: SubTasks[];

  @ApiProperty({
    required: true,
  })
  @IsString()
  statusId: string;
}

type SubTasks = {
  id: string;
  content: string
}


export class UpdateTaskDto extends PartialType(CreateTaskDTO) {
  subTasksId: string
}