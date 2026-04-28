/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface GlpiTicket {
  id: number;
}

const TOKEN_EXPIRY_BUFFER_MS = 60_000;

@Injectable()
export class GlpiService {
  private accessToken: string = '';
  private tokenExpiresAt: number = 0;

  constructor(private readonly httpService: HttpService) {}

  private isTokenExpired(): boolean {
    return !this.accessToken || Date.now() >= this.tokenExpiresAt;
  }

  async getAuthToken(): Promise<void> {
    const url = `${process.env.GLPI_BASE_URL}/token`;
    const payload = {
      grant_type: 'password',
      client_id: process.env.GLPI_CLIENT_ID,
      client_secret: process.env.GLPI_CLIENT_SECRET,
      username: process.env.GLPI_USERNAME,
      password: process.env.GLPI_PASSWORD,
      scope: 'api',
    };

    const response = await firstValueFrom(this.httpService.post(url, payload));

    const expiresIn: number = (response.data.expires_in as number) ?? 3600;
    this.accessToken = response.data.access_token as string;
    this.tokenExpiresAt =
      Date.now() + expiresIn * 1000 - TOKEN_EXPIRY_BUFFER_MS;
  }

  private async ensureValidToken(): Promise<void> {
    if (this.isTokenExpired()) await this.getAuthToken();
  }

  async createTicket(title: string, content: string): Promise<GlpiTicket> {
    try {
      await this.ensureValidToken();

      const url = `${process.env.GLPI_BASE_URL}/Assistance/Ticket`;

      const body = {
        name: title,
        content: content,
        type: 1,
      };

      const response = await firstValueFrom(
        this.httpService.post(url, body, {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }),
      );

      console.log('Chamado criado com sucesso:', response.data.id);
      return response.data as GlpiTicket;
    } catch (error) {
      console.error(
        'Erro na API do GLPI:',
        error.response?.data || error.message,
      );
      throw error;
    }
  }

  async solveTicket(ticketId: number, solutionText: string): Promise<void> {
    try {
      await this.ensureValidToken();

      const solutionUrl = `${process.env.GLPI_BASE_URL}/Assistance/Ticket/${ticketId}/Timeline/Solution`;

      await firstValueFrom(
        this.httpService.post(
          solutionUrl,
          { content: solutionText, status: 3 },
          { headers: { Authorization: `Bearer ${this.accessToken}` } },
        ),
      );

      const ticketUrl = `${process.env.GLPI_BASE_URL}/Assistance/Ticket/${ticketId}`;

      await firstValueFrom(
        this.httpService.patch(
          ticketUrl,
          { status: 5 },
          { headers: { Authorization: `Bearer ${this.accessToken}` } },
        ),
      );

      console.log(`Chamado ${ticketId} solucionado com sucesso.`);
    } catch (error) {
      console.error(
        'Erro ao solucionar chamado no GLPI:',
        error.response?.data || error.message,
      );
      throw error;
    }
  }

  async escalateTicket(ticketId: number, errorMessage: string): Promise<void> {
    try {
      await this.ensureValidToken();

      const groupId = Number(process.env.GLPI_ESCALATION_GROUP_ID ?? 1);

      const followupUrl = `${process.env.GLPI_BASE_URL}/Assistance/Ticket/${ticketId}/Timeline/Followup`;

      await firstValueFrom(
        this.httpService.post(
          followupUrl,
          {
            content: `⚠️ FALHA: O middleware tentou reiniciar o serviço, mas encontrou o erro: <br><code>${errorMessage}</code><br>Encaminhando para análise humana.`,
          },
          { headers: { Authorization: `Bearer ${this.accessToken}` } },
        ),
      );

      const ticketUrl = `${process.env.GLPI_BASE_URL}/Assistance/Ticket/${ticketId}`;

      await firstValueFrom(
        this.httpService.patch(
          ticketUrl,
          {
            status: 2,
            _actors: {
              assign: [
                { itemtype: 'Group', items_id: groupId, use_notification: 1 },
              ],
            },
          },
          { headers: { Authorization: `Bearer ${this.accessToken}` } },
        ),
      );

      console.warn(
        `Chamado ${ticketId} escalonado para o grupo ${groupId} devido a falha na cura.`,
      );
    } catch (error) {
      console.error(
        'Erro ao escalonar chamado no GLPI:',
        error.response?.data || error.message,
      );
      throw error;
    }
  }

  async addFollowup(ticketId: number, content: string): Promise<void> {
    try {
      await this.ensureValidToken();

      const url = `${process.env.GLPI_BASE_URL}/Assistance/Ticket/${ticketId}/Timeline/Followup`;

      await firstValueFrom(
        this.httpService.post(
          url,
          { content: content, is_private: false },
          {
            headers: {
              Authorization: `Bearer ${this.accessToken}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      console.log(`Acompanhamento adicionado ao chamado ${ticketId}.`);
    } catch (error) {
      console.error(
        'Erro ao adicionar acompanhamento no GLPI:',
        error.response?.data || error.message,
      );
      throw error;
    }
  }
}
