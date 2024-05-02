import { ApiProperty } from '@nestjs/swagger';
import { MinLength } from 'class-validator';

export class CreateStatusDTO {
  @ApiProperty({
    required: true,
  })
  @MinLength(3)
  name: string;
}
