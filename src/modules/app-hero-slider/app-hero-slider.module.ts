import { Module } from '@nestjs/common';
import { AppHeroSliderService } from './app-hero-slider.service';
import { AppHeroSliderController } from './app-hero-slider.controller';

@Module({
  controllers: [AppHeroSliderController],
  providers: [AppHeroSliderService],
})
export class AppHeroSliderModule {}
