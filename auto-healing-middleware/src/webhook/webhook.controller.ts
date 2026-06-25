import {
  Controller,
  Post,
  Body,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { GlpiService } from '../glpi/glpi.service';
import { HealingService } from '../automation/healing/healing.service';
import { AiOpsService } from '../aiops/aiops.service';
import { ZabbixAlertDto } from './dto/zabbix-alert.dto';

@Controller('webhook')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);
  private readonly activeHealings = new Set<string>();

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

    this.logger.log('=== Novo alerta recebido do Zabbix ===');
    this.logger.log(
      `Payload recebido (webhook /zabbix):\n${JSON.stringify(alertData, null, 2)}`,
    );
    this.logger.log(`HostName : ${host}`);
    this.logger.log(`HostIP   : ${ip}`);
    this.logger.log(`Service  : ${service}`);
    this.logger.log(`Subject  : ${triggerName}`);

    const healingKey = `${ip}:${service}`;

    if (this.activeHealings.has(healingKey)) {
      this.logger.warn(
        `Auto-healing já em andamento para ${service} em ${ip} — requisição ignorada (409).`,
      );
      throw new ConflictException(
        `Auto-healing já em andamento para ${service} em ${ip}`,
      );
    }

    this.activeHealings.add(healingKey);

    try {
      this.logger.log(
        `Iniciando Auto-healing para ${host} (${ip}) - Serviço: ${service}`,
      );

      const ticket = await this.glpiService.createTicket(
        `[AUTO-HEALING] Falha Detectada: ${host}`,
        `Alerta: ${triggerName}. O middleware tentará reiniciar o serviço ${service} no IP ${ip}.`,
      );
      this.logger.log(`Chamado GLPI criado: #${ticket.id}`);

      this.logger.log('Solicitando análise inteligente (AIOps/Gemini)...');
      const aiAnalysis = await this.aiOpsService.analyzeIncident(
        triggerName,
        host,
        service,
      );

      await this.glpiService.addFollowup(
        ticket.id,
        `🤖 **Análise Inteligente (AIOps):**<br>${aiAnalysis}`,
      );
      this.logger.log(`Análise da IA anexada ao chamado #${ticket.id}`);

      try {
        const command = `sudo systemctl restart ${service} && systemctl is-active ${service}`;
        this.logger.log(
          `Disparando autocura via SSH em ${host} (${ip}): "${command}"`,
        );
        const output = await this.healingService.executeRemoteCommand(
          ip,
          command,
        );

        this.logger.log(
          `Sucesso ao reiniciar ${service} em ${host}. Resposta do host: "${output.trim() || '(sem saída)'}"`,
        );
        const message = `O serviço ${service} foi reiniciado com sucesso via automação.`;
        await this.glpiService.solveTicket(ticket.id, message);
        this.logger.log(`Chamado #${ticket.id} solucionado (status healed).`);

        return {
          status: 'healed',
          message: 'Cura aplicada e chamado solucionado',
          ticketId: ticket.id,
        };
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        this.logger.error(`Erro na autocura de ${host}: ${errorMessage}`);
        await this.glpiService.escalateTicket(ticket.id, errorMessage);
        this.logger.warn(
          `Chamado #${ticket.id} escalonado para análise humana.`,
        );

        return { status: 'failed_and_escalated', error: errorMessage };
      }
    } finally {
      this.activeHealings.delete(healingKey);
      this.logger.log(`Trava de concorrência liberada para ${healingKey}.`);
    }
  }
}
