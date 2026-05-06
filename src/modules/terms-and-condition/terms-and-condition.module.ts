import { Module } from '@nestjs/common';
import { TermsAndConditionService } from './terms-and-condition.service';
import { TermsAndConditionController } from './terms-and-condition.controller';

@Module({
  controllers: [TermsAndConditionController],
  providers: [TermsAndConditionService],
})
export class TermsAndConditionModule {}
