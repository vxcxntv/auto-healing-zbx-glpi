import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GlpiModule } from './glpi/glpi.module';
import { WebhookController } from './webhook/webhook.controller';

@Module({
  imports: [GlpiModule],
  controllers: [AppController, WebhookController],
  providers: [AppService],
})
export class AppModule {}
