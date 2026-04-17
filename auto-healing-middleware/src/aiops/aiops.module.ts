import { Module } from '@nestjs/common';
import { AiOpsService } from './aiops.service';

@Module({
  providers: [AiOpsService],
  exports: [AiOpsService],
})
export class AiOpsModule {}
