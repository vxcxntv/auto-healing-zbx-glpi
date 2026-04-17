/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class AiOpsService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY não está definida');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);

    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  }

  async analyzeIncident(
    triggerName: string,
    host: string,
    service: string,
  ): Promise<string> {
    const prompt = `
      Você é um especialista em SRE e Infraestrutura. 
      Analise o seguinte alerta de monitoramento:
      - Alerta: ${triggerName}
      - Host: ${host}
      - Serviço Afetado: ${service}

      Forneça uma resposta curta e técnica formatada em HTML (use tags <b> e <br>) contendo:
      1. Descrição resumida do provável problema.
      2. Impactos possíveis no negócio/usuários.
      3. Sugestões de verificação definitiva para um analista humano.
      Mantenha o tom profissional e direto.
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Falha na análise de IA:', error);
      return 'Não foi possível gerar a análise inteligente no momento.';
    }
  }
}
