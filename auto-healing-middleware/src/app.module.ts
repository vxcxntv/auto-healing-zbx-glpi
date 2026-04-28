import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GlpiModule } from './glpi/glpi.module';
import { WebhookController } from './webhook/webhook.controller';
import { HealingModule } from './automation/healing/healing.module';
import { AiOpsModule } from './aiops/aiops.module';

@Module({
  imports: [GlpiModule, AiOpsModule, HealingModule],
  controllers: [AppController, WebhookController],
  providers: [AppService],
})
export class AppModule {}
