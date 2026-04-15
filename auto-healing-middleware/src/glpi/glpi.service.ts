/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class GlpiService {
  private accessToken: string;

  constructor(private readonly httpService: HttpService) {}

  async getAuthToken() {
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

    this.accessToken = response.data.access_token;
    return this.accessToken;
  }

  async createTicket(title: string, content: string) {
    try {
      if (!this.accessToken) await this.getAuthToken();

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
      return response.data;
    } catch (error) {
      console.error(
        'Erro na API do GLPI:',
        error.response?.data || error.message,
      );
      throw error;
    }
  }

  async solveTicket(ticketId: number, solutionText: string) {
    try {
      if (!this.accessToken) await this.getAuthToken();

      // adicionar a solução ao chamado
      const solutionUrl = `${process.env.GLPI_BASE_URL}/Assistance/Ticket/${ticketId}/Timeline/Solution`;
      const solutionBody = {
        content: solutionText,
        status: 3, // status da solução
      };

      await firstValueFrom(
        this.httpService.post(solutionUrl, solutionBody, {
          headers: { Authorization: `Bearer ${this.accessToken}` },
        }),
      );

      // atualizar o status do chamado para solucionado
      const ticketUrl = `${process.env.GLPI_BASE_URL}/Assistance/Ticket/${ticketId}`;
      const ticketUpdateBody = {
        status: 5,
      };

      const response = await firstValueFrom(
        this.httpService.patch(ticketUrl, ticketUpdateBody, {
          headers: { Authorization: `Bearer ${this.accessToken}` },
        }),
      );

      console.log(`Chamado ${ticketId} solucionado com sucesso.`);
      return response.data;
    } catch (error) {
      console.error(
        'Erro ao solucionar chamado no GLPI:',
        error.response?.data || error.message,
      );
      throw error;
    }
  }

  async escalateTicket(ticketId: number, errorMessage: string) {
    const url = `${process.env.GLPI_BASE_URL}/Assistance/Ticket/${ticketId}`;
    const body = {
      status: 2, // status atribuído (Em atendimento)
      groups_id_assign: 1, // id do grupo no glpi
      content: `FALHA NA AUTOCURA: ${errorMessage}. Encaminhado para análise urgente.`,
    };

    return firstValueFrom(
      this.httpService.patch(url, body, {
        headers: { Authorization: `Bearer ${this.accessToken}` },
      }),
    );
  }
}
