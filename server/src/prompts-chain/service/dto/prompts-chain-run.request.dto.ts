import { IsNotEmpty, IsString } from 'class-validator';

export class PromptsChainRunRequestDto {
  @IsString()
  @IsNotEmpty()
  sourceText!: string;
}
