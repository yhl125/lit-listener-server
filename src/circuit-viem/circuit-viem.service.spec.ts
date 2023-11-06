import { Test, TestingModule } from '@nestjs/testing';
import { CircuitViemService } from './circuit-viem.service';

describe('CircuitViemService', () => {
  let service: CircuitViemService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CircuitViemService],
    }).compile();

    service = module.get<CircuitViemService>(CircuitViemService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
