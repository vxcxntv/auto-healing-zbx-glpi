/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Controller, Post, Body } from '@nestjs/common';
import { GlpiService } from '../glpi/glpi.service';

@Controller('webhook')
export class WebhookController {
  constructor(private readonly glpiService: GlpiService) {}

  @Post('zabbix')
  async handleZabbixAlert(@Body() alertData: any) {
    console.log('Alerta recebido do Zabbix:', alertData);

    // 1. Registra no GLPI
    await this.glpiService.createTicket(
      `[AUTO-HEALING] Falha em ${alertData.host}`,
      `O serviço ${alertData.service} caiu. Iniciando tentativa de recuperação.`,
    );

    return { status: 'processando' };
  }
}
