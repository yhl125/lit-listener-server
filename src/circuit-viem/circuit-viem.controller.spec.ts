import { Test, TestingModule } from '@nestjs/testing';
import { CircuitViemController } from './circuit-viem.controller';
import { CircuitViemService } from './circuit-viem.service';

describe('CircuitViemController', () => {
  let controller: CircuitViemController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CircuitViemController],
      providers: [CircuitViemService],
    }).compile();

    controller = module.get<CircuitViemController>(CircuitViemController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
