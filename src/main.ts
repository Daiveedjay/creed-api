/* eslint-disable prettier/prettier */
import 'dotenv/config';
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

  // Enable cors
  app.enableCors({
    origin: ['http://localhost:5173', 'https://kreed.tech'], // Replace with your frontend URL
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true, // Enable credentials if necessary
  });

  await app.listen(3000);
  Logger.log(
    'Swagger is ready on: ' + 'http://localhost:' + 3000 + '/' + 'docs',
  );
  Logger.log('Application started on: ' + 'http://localhost:' + 3000);
}
bootstrap();
