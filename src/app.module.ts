import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { CircuitViemModule } from './circuit-viem/circuit-viem.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    EventEmitterModule.forRoot(),
    CircuitViemModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
