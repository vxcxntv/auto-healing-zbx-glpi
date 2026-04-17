import { Test, TestingModule } from '@nestjs/testing';
import { AiopsService } from './aiops.service';

describe('AiopsService', () => {
  let service: AiopsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AiopsService],
    }).compile();

    service = module.get<AiopsService>(AiopsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
