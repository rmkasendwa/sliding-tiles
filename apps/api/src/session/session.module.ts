import { Global, Module } from '@nestjs/common';

import { SessionService } from './session.service';

@Global()
@Module({
  exports: [SessionService],
  providers: [SessionService],
})
export class SessionModule {}
