import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import {
  AddTermsAndConditionDto,
  UpdateTermsAndConditionDto,
} from './dto/terms-condition.dto';
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

  async getAllTermsAndConditionForAll(page = 1, limit = 10, search?: string) {
    const where: Prisma.TermsAndConditionWhereInput = {};

    if (search) {
      where.OR = [
        {
          content: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          version: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.termsAndCondition.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
      }),
      this.prisma.termsAndCondition.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getActiveTermsAndCondition() {
    return await this.prisma.termsAndCondition.findFirst({
      where: { isActive: true },
    });
  }

  async getTermsAndConditionByVersion(id: string) {
    return await this.prisma.termsAndCondition.findUnique({
      where: { id },
    });
  }

  async updateTermsAndCondition(
    id: string,
    payload: UpdateTermsAndConditionDto,
  ) {
    return this.prisma.$transaction(async (tx) => {
      // 1. ensure record exists
      const existing = await tx.termsAndCondition.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new BadRequestException('Terms and Condition not found');
      }

      // 2. if activating this record → deactivate others
      if (payload.isActive) {
        await tx.termsAndCondition.updateMany({
          where: {
            isActive: true,
            NOT: { id },
          },
          data: {
            isActive: false,
          },
        });
      }

      // 3. update only provided fields
      return tx.termsAndCondition.update({
        where: { id },
        data: {
          ...(payload.content !== undefined && {
            content: payload.content,
          }),
          ...(payload.isActive !== undefined && {
            isActive: payload.isActive,
          }),
        },
      });
    });
  }
}
