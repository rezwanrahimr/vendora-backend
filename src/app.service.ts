import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello() {
    return JSON.stringify({
      message: 'Welcome to YasminaArsic API Service!',
      doc:
        process.env.NODE_ENV === 'production'
          ? 'https://yasminaarsic-server.onrender.com/doc'
          : 'http://localhost:3000/doc',
    });
  }
}
