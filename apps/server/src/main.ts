import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true, // 경로 파라미터나 쿼리 파라미터를 DTO에 명시된 타입으로 암묵적 변환 시도
      },
    }),
  );
  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(app.get('Reflector')),
  );

  await app.listen(process.env.PORT ?? 4000);
}
bootstrap();
