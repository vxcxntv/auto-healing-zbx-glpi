import { Module } from '@nestjs/common';
import { HealingService } from './healing.service';

@Module({
  providers: [HealingService],
  exports: [HealingService],
})
export class HealingModule {}
