/* eslint-disable prettier/prettier */
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsArray, IsDate, IsDateString, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
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
    type: String
  })
  @IsString()
  @MinLength(3)
  title: string;

  @ApiProperty({
    required: false,
    minLength: 5,
    type: String
  })
  @MinLength(5)
  @IsString()
  description: string;

  @ApiProperty({
    required: true,
    type: Number
  })
  @IsNotEmpty()
  order: number;

  @ApiProperty({
    type: [String],
    required: false
  })
  @IsArray()
  @IsOptional()
  usersToAssignIds: string[]

  @ApiProperty({
    required: false,
    type: Date
  })
  @IsOptional()
  assignedFrom: Date;

  @ApiProperty({
    required: false,
    type: Date
  })
  @IsOptional()
  assignedTo: Date;

  @ApiProperty({
    required: false,
    type: [SubTasksDto]
  })
  @IsArray()
  @IsOptional()
  subTasks: SubTasksDto[];

  @ApiProperty({
    type: String,
    required: false,
  })
  @IsString()
  statusId: string;
}


export class UpdateTaskDto extends PartialType(CreateTaskDTO) { }

export class UpdateMultipleTasksDto extends PartialType(CreateTaskDTO) {
  @ApiProperty({
    type: String,
    required: true
  })
  @IsString()
  id: string
}
