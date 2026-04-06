/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { Client } from 'ssh2';

@Injectable()
export class HealingService {
  async executeRemoteCommand(host: string, command: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const conn = new Client();

      conn
        .on('ready', () => {
          console.log(`Conectado ao host: ${host}`);
          conn.exec(command, (err, stream) => {
            if (err) return reject(err);

            let output = '';
            stream
              .on('close', (code, signal) => {
                conn.end();
                resolve(output);
              })
              .on('data', (data: { toString: () => string }) => {
                output += data.toString();
              })
              .stderr.on('data', (data) => {
                console.error('STDERR:', data.toString());
              });
          });
        })
        .on('error', (err) => {
          reject(err);
        })
        .connect({
          host: host,
          port: 22,
          username: process.env.SSH_USER, // lembrar de configurar no Dokploy!!!!
          privateKey: require('fs').readFileSync('/app/ssh/id_rsa'), // chave privada do host!!
        });
    });
  }
}
