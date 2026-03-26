import { Module } from '@nestjs/common';
import { GlpiService } from './glpi.service';

@Module({
  providers: [GlpiService]
})
export class GlpiModule {}
