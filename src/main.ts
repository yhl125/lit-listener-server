import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ maxParamLength: 200 }),
  );
  const configService = app.get(ConfigService);
  const corsOrigin = configService.get<string>('FRONTEND_URLS').split(', ');

  app.enableCors({
    origin: corsOrigin,
  });

  const config = new DocumentBuilder()
    .setTitle('lit-listener-server')
    .setDescription('lit-listener-server API')
    .setVersion('0.0.1')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  app.enableShutdownHooks();

  await app.listen(3001, '0.0.0.0');
}
bootstrap();
