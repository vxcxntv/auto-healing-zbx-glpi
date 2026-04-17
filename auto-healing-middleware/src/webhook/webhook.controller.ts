/* eslint-disable @typescript-eslint/no-unsafe-argument */
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
    const host = alertData.HostName;
    const ip = alertData.HostIP;
    const service = alertData.Service;
    const triggerName = alertData.Subject;

    console.log(
      `Iniciando Auto-healing para ${host} (${ip}) - Serviço: ${service}`,
    );

    const ticket = await this.glpiService.createTicket(
      `[AUTO-HEALING] Falha Detectada: ${host}`,
      `Alerta: ${triggerName}. O middleware tentará reiniciar o serviço ${service} no IP ${ip}.`,
    );

    try {
      //comando de autocura via SSH
      const command = `sudo systemctl restart ${service}`;
      await this.healingService.executeRemoteCommand(ip, command);

      //se sucesso
      console.log(`Sucesso ao reiniciar ${service} em ${host}`);
      const message = `O serviço ${service} foi reiniciado com sucesso via automação.`;
      await this.glpiService.solveTicket(ticket.id, message);

      return {
        status: 'healed',
        message: 'Cura aplicada e chamado solucionado',
        ticketId: ticket.id,
      };
    } catch (error) {
      console.error(`Erro na autocura de ${host}:`, error.message);
      //se falha
      await this.glpiService.escalateTicket(ticket.id, error.message);

      return { status: 'failed_and_escalated', error: error.message };
    }
  }
}
