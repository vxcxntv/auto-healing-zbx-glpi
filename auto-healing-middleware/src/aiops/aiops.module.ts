import { Module } from '@nestjs/common';
import { AiOpsService } from './aiops.service';

@Module({
  providers: [AiOpsService],
})
export class AiOpsModule {}
