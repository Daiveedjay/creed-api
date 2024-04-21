import { ApiProperty } from "@nestjs/swagger";
import { MinLength } from "class-validator";


export class CreateTaskDTO {
  @ApiProperty()
  @MinLength(3)
  name: string;
}