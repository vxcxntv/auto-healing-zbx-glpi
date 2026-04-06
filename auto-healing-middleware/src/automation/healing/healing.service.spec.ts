import { Test, TestingModule } from '@nestjs/testing';
import { HealingService } from './healing.service';

describe('HealingService', () => {
  let service: HealingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HealingService],
    }).compile();

    service = module.get<HealingService>(HealingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
