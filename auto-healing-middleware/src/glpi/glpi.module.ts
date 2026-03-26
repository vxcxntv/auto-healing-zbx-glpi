import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { GlpiService } from './glpi.service';

@Module({
  imports: [HttpModule],
  providers: [GlpiService],
})
export class GlpiModule {}
