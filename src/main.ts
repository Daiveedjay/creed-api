/* eslint-disable prettier/prettier */
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { SwaggerTheme } from 'swagger-themes';
import { AppModule } from './app.module';
import { SwaggerThemeNameEnum } from 'swagger-themes/build/enums/swagger-theme-name';
import { ValidationPipe } from '@nestjs/common';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const theme = new SwaggerTheme();

  // Enable cors
  app.enableCors();

  // API input validation
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Creed API')
    .setDescription('Creed Backend API documentation')
    .setVersion('v1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    customCss: theme.getBuffer(SwaggerThemeNameEnum.DARK),
  });

  await app.listen(3000);
  Logger.log(
    'Swagger is ready on: ' + 'http://localhost:' + 3000 + '/' + 'docs',
  );
  Logger.log('Application started on: ' + 'http://localhost:' + 3000);
}
bootstrap();
