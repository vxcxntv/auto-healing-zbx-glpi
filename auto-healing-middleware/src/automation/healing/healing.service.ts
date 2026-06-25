import { Injectable, Logger } from '@nestjs/common';
import { Client } from 'ssh2';
import * as fs from 'fs';

@Injectable()
export class HealingService {
  private readonly logger = new Logger(HealingService.name);

  async executeRemoteCommand(host: string, command: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const conn = new Client();
      const privateKeyPath = '/app/ssh/id_rsa_healing';
      const username = process.env.SSH_USER || 'middle'; // usuário com permissões limitadas

      if (!fs.existsSync(privateKeyPath)) {
        this.logger.error(`Chave privada não encontrada em ${privateKeyPath}`);
        return reject(
          new Error(`Chave privada não encontrada em ${privateKeyPath}`),
        );
      }

      this.logger.log(
        `Abrindo conexão SSH em ${host}:22 como "${username}"...`,
      );

      conn
        .on('ready', () => {
          this.logger.log(`Conexão SSH estabelecida com ${host}.`);
          this.logger.log(`Executando comando remoto: ${command}`);

          conn.exec(command, (err, stream) => {
            if (err) {
              this.logger.error(
                `Falha ao iniciar execução do comando: ${err.message}`,
              );
              return reject(err);
            }

            let stdout = '';
            let stderr = '';
            stream
              .on('close', (code: number) => {
                conn.end();

                if (stdout.trim())
                  this.logger.log(`Saída do host (stdout):\n${stdout.trim()}`);
                if (stderr.trim())
                  this.logger.warn(`Saída do host (stderr):\n${stderr.trim()}`);

                if (code !== 0) {
                  this.logger.error(
                    `Comando finalizado com código ${code} (falha).`,
                  );
                  return reject(new Error(`Comando falhou com código ${code}`));
                }

                this.logger.log(
                  `Comando finalizado com código ${code} (sucesso).`,
                );
                resolve(stdout);
              })
              .on('data', (data: Buffer) => {
                stdout += data.toString();
              })
              .stderr.on('data', (data: Buffer) => {
                stderr += data.toString();
              });
          });
        })
        .on('error', (err) => {
          this.logger.error(`Erro na conexão SSH com ${host}: ${err.message}`);
          reject(err);
        })
        .connect({
          host: host,
          port: 22,
          username: username,
          privateKey: fs.readFileSync(privateKeyPath),
        });
    });
  }
}
