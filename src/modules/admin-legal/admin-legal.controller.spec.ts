import { Test, TestingModule } from '@nestjs/testing';
import { AdminLegalController } from './admin-legal.controller';
import { AdminLegalService } from './admin-legal.service';

describe('AdminLegalController', () => {
  let controller: AdminLegalController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminLegalController],
      providers: [AdminLegalService],
    }).compile();

    controller = module.get<AdminLegalController>(AdminLegalController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
