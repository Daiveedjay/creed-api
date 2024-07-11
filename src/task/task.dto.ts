/* eslint-disable prettier/prettier */
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsArray, IsDate, IsString, MinLength } from 'class-validator';
export class SubTasksDto {

  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  done: boolean
}

export class CreateTaskDTO {
  @ApiProperty({
    required: false,
    minLength: 3,
  })
  @IsString()
  @MinLength(3)
  title: string;

  @ApiProperty({
    required: false,
    minLength: 5,
  })
  @MinLength(5)
  @IsString()
  description: string;

  @ApiProperty({
    required: true,
    type: Number
  })
  order: number;

  @ApiProperty({
    type: [String],
    required: false
  })
  @IsArray()
  usersToAssignIds: string[]

  @ApiProperty({
    required: false,
    type: Date
  })
  @IsDate()
  assignedFrom: Date;

  @ApiProperty({
    required: false,
    type: Date
  })
  @IsDate()
  assignedTo: Date;

  @ApiProperty({
    required: false,
    type: [SubTasksDto]
  })
  @IsArray()
  subTasks: SubTasksDto[];

  @ApiProperty({
    required: false,
  })
  @IsString()
  statusId: string;
}


export class UpdateTaskDto extends PartialType(CreateTaskDTO) { }
