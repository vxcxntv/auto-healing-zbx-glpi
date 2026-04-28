import { Controller, Post, Body } from '@nestjs/common';
import { GlpiService } from '../glpi/glpi.service';
import { HealingService } from '../automation/healing/healing.service';
import { AiOpsService } from '../aiops/aiops.service';
import { ZabbixAlertDto } from './dto/zabbix-alert.dto';

@Controller('webhook')
export class WebhookController {
  constructor(
    private readonly glpiService: GlpiService,
    private readonly aiOpsService: AiOpsService,
    private readonly healingService: HealingService,
  ) {}

  @Post('zabbix')
  async handleZabbixAlert(@Body() alertData: ZabbixAlertDto) {
    const {
      HostName: host,
      HostIP: ip,
      Service: service,
      Subject: triggerName,
    } = alertData;

    console.log(
      `Iniciando Auto-healing para ${host} (${ip}) - Serviço: ${service}`,
    );

    const ticket = await this.glpiService.createTicket(
      `[AUTO-HEALING] Falha Detectada: ${host}`,
      `Alerta: ${triggerName}. O middleware tentará reiniciar o serviço ${service} no IP ${ip}.`,
    );

    const aiAnalysis = await this.aiOpsService.analyzeIncident(
      triggerName,
      host,
      service,
    );

    await this.glpiService.addFollowup(
      ticket.id,
      `🤖 **Análise Inteligente (AIOps):**<br>${aiAnalysis}`,
    );

    try {
      const command = `sudo systemctl restart ${service}`;
      await this.healingService.executeRemoteCommand(ip, command);

      console.log(`Sucesso ao reiniciar ${service} em ${host}`);
      const message = `O serviço ${service} foi reiniciado com sucesso via automação.`;
      await this.glpiService.solveTicket(ticket.id, message);

      return {
        status: 'healed',
        message: 'Cura aplicada e chamado solucionado',
        ticketId: ticket.id,
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(`Erro na autocura de ${host}:`, errorMessage);
      await this.glpiService.escalateTicket(ticket.id, errorMessage);

      return { status: 'failed_and_escalated', error: errorMessage };
    }
  }
}
