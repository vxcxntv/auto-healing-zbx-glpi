/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
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
    if (!this.accessToken) await this.getAuthToken();

    const url = `${process.env.GLPI_BASE_URL}/Ticket`;
    const body = {
      input: {
        name: title,
        content: content,
        status: 1, // Novo
      },
    };

    return firstValueFrom(
      this.httpService.post(url, body, {
        headers: { Authorization: `Bearer ${this.accessToken}` },
      }),
    );
  }
}
