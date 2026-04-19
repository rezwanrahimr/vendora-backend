import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello() {
    return {
      message: 'Welcome to Yasmina API',
      doc: `http://localhost:${process.env.PORT || 3000}/doc`,
    };
  }
}
