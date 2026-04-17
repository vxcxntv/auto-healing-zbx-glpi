import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GlpiModule } from './glpi/glpi.module';
import { WebhookController } from './webhook/webhook.controller';
import { HealingService } from './automation/healing/healing.service';
import { AiopsModule } from './aiops/aiops.module';

@Module({
  imports: [GlpiModule, AiopsModule],
  controllers: [AppController, WebhookController],
  providers: [AppService, HealingService],
})
export class AppModule {}
