import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { SaveLanguageDto, SaveSystemDto } from './dto/admin-general.dto';

@Injectable()
export class AdminGeneralService {
  constructor(private readonly prisma: PrismaService) {}

  private static readonly SINGLETON_ID = 'ADMIN_GENERAL_SETTINGS_SINGLETON_ID';

  private clean<T extends object>(dto: T): Partial<T> {
    return Object.fromEntries(
      Object.entries(dto).filter(([, v]) => v !== undefined),
    ) as Partial<T>;
  }

  private upsert<T extends object>(dto: T) {
    const data = this.clean(dto);

    return this.prisma.adminGeneralSettings.upsert({
      where: { id: AdminGeneralService.SINGLETON_ID },
      update: data,
      create: {
        id: AdminGeneralService.SINGLETON_ID,
        ...data,
      },
    });
  }

  upsertLanguage(dto: SaveLanguageDto) {
    return this.upsert(dto);
  }

  upsertSystem(dto: SaveSystemDto) {
    return this.upsert(dto);
  }

  getAdminGeneral() {
    return this.prisma.adminGeneralSettings.upsert({
      where: { id: AdminGeneralService.SINGLETON_ID },
      update: {},
      create: {
        id: AdminGeneralService.SINGLETON_ID,
      },
    });
  }
}
