import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { AddTermsAndConditionDto } from './dto/terms-condition.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class TermsAndConditionService {
  constructor(private readonly prisma: PrismaService) {}

  private generateYearVersion() {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');

    const random = Math.floor(1000 + Math.random() * 9000);

    return `${year}${month}-${random}`;
  }

  async addTermsAndCondition(payload: AddTermsAndConditionDto) {
    // ensure single active safety
    if (payload.isActive) {
      const exists = await this.prisma.termsAndCondition.findFirst({
        where: { isActive: true },
      });

      if (exists) {
        throw new BadRequestException(
          'Only one terms and condition can be active at a time',
        );
      }
    }

    // retry mechanism for version collision
    for (let i = 0; i < 5; i++) {
      const version = this.generateYearVersion();

      try {
        return await this.prisma.termsAndCondition.create({
          data: {
            content: payload.content,
            isActive: payload.isActive ?? false,
            version,
          },
        });
      } catch (err) {
        if (
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === 'P2002'
        ) {
          // duplicate version → retry
          continue;
        }

        throw err;
      }
    }

    throw new BadRequestException('Failed to generate unique version');
  }


  
}
