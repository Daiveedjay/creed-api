import { ApiProperty } from "@nestjs/swagger";
import { MinLength } from "class-validator";


export class CreateDomainDTO {
  @ApiProperty()
  @MinLength(3)
  name: string;
}

export class UpdateDefaultDomainDTO {
  @ApiProperty()
  @MinLength(3)
  domainID: string;
}