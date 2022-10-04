import { IsInt, IsPositive, MinLength, IsString } from 'class-validator';

export class CreatePokemonDto {
  @IsInt()
  @IsPositive()
  @MinLength(1)
  no: number;

  @IsString()
  @MinLength(1)
  name: string;
}
