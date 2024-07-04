import { ApiProperty } from '@nestjs/swagger';
import { MinLength } from 'class-validator';
export class CreatePanelDTO {
  @ApiProperty()
  @MinLength(3)
  name: string;
}

export class AddUsersDto {
  @ApiProperty()
  userIds: string[];
}
