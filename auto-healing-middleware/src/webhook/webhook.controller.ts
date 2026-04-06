/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Controller, Post, Body } from '@nestjs/common';
import { GlpiService } from '../glpi/glpi.service';
import { HealingService } from '../automation/healing/healing.service';

@Controller('webhook')
export class WebhookController {
  constructor(
    private readonly glpiService: GlpiService,
    private readonly healingService: HealingService,
  ) {}

  @Post('zabbix')
  async handleZabbixAlert(@Body() alertData: any) {
    const ticket = await this.glpiService.createTicket(
      `[AUTO-HEALING] Falha em ${alertData.host}`,
      `O serviço ${alertData.service_to_fix} parou. Tentando reinicialização automática.`,
    );

    try {
      const command = `sudo systemctl restart ${alertData.service_to_fix}`;
      const result = await this.healingService.executeRemoteCommand(
        alertData.ip,
        command,
      );

      console.log('Cura executada com sucesso:', result);

      return { status: 'success', ticketId: ticket.id };
    } catch (error) {
      console.error('Falha na autocura:', error.message);
      return { status: 'failed', error: error.message };
    }
  }
}
