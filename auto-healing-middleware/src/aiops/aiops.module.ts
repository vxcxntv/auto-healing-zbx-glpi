import { Module } from '@nestjs/common';
import { AiopsService } from './aiops.service';

@Module({
  providers: [AiopsService]
})
export class AiopsModule {}
