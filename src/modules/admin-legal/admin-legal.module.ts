import { Module } from '@nestjs/common';
import { AdminLegalService } from './admin-legal.service';
import { AdminLegalController } from './admin-legal.controller';

@Module({
  controllers: [AdminLegalController],
  providers: [AdminLegalService],
})
export class AdminLegalModule {}
