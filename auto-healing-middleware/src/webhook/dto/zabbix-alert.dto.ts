import { IsIP, IsNotEmpty, IsString } from 'class-validator';

export class ZabbixAlertDto {
  @IsString()
  @IsNotEmpty()
  HostName: string;

  @IsIP()
  @IsNotEmpty()
  HostIP: string;

  @IsString()
  @IsNotEmpty()
  Service: string;

  @IsString()
  @IsNotEmpty()
  Subject: string;
}
