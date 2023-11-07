import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CircuitViemModule } from './circuit-viem/circuit-viem.module';
import { MongooseModule } from '@nestjs/mongoose';
import { CircuitModule } from './circuit/circuit.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),
    CircuitViemModule,
    CircuitModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
