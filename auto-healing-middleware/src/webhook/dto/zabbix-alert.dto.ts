import { IsNotEmpty, IsString } from 'class-validator';

export class ZabbixAlertDto {
  @IsString()
  @IsNotEmpty()
  HostName: string;

  @IsString()
  @IsNotEmpty()
  HostIP: string;

  @IsString()
  @IsNotEmpty()
  Service: string;

  @IsString()
  @IsNotEmpty()
  Subject: string;
}
