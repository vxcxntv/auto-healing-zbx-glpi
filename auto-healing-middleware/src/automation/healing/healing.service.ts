/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { Client } from 'ssh2';
import * as fs from 'fs';

@Injectable()
export class HealingService {
  async executeRemoteCommand(host: string, command: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const conn = new Client();
      const privateKeyPath = '/app/ssh/id_rsa_healing';

      if (!fs.existsSync(privateKeyPath)) {
        return reject(
          new Error(`Chave privada não encontrada em ${privateKeyPath}`),
        );
      }

      conn
        .on('ready', () => {
          conn.exec(command, (err, stream) => {
            if (err) return reject(err);

            let output = '';
            stream
              .on('close', (code) => {
                conn.end();
                if (code !== 0)
                  return reject(new Error(`Comando falhou com código ${code}`));
                resolve(output);
              })
              .on('data', (data: Buffer) => {
                output += data.toString();
              });
          });
        })
        .on('error', (err) => {
          reject(err);
        })
        .connect({
          host: host,
          port: 22,
          username: process.env.SSH_USER || 'middle', // usuário com permissões limitadas
          privateKey: fs.readFileSync(privateKeyPath),
        });
    });
  }
}
