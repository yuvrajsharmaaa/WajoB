import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);
  const port = configService.get('PORT') || 3001;
  const apiPrefix = configService.get('API_PREFIX') || 'api/v1';

  // Security
  app.use(helmet());
  
  // CORS
  app.enableCors({
    origin: configService.get('CORS_ORIGIN')?.split(',') || '*',
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix(apiPrefix);

  // Validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('WajoB API')
    .setDescription(
      'Backend API for WajoB - TON Blockchain Daily-Wage Job Marketplace',
    )
    .setVersion('1.0')
    .addTag('jobs', 'Job management endpoints')
    .addTag('escrow', 'Escrow payment endpoints')
    .addTag('reputation', 'Reputation system endpoints')
    .addTag('users', 'User management endpoints')
    .addTag('telegram', 'Telegram bot integration')
    .addTag('blockchain', 'Blockchain indexer endpoints')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(`${apiPrefix}/docs`, app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(port);
  
  console.log(`
  ╔═══════════════════════════════════════════════════════════╗
  ║                                                           ║
  ║   🚀 WajoB Backend Server Running                        ║
  ║                                                           ║
  ║   🌐 Server: http://localhost:${port}                         ║
  ║   📚 API Docs: http://localhost:${port}/${apiPrefix}/docs        ║
  ║   🔧 Environment: ${configService.get('NODE_ENV')?.toUpperCase()}                       ║
  ║   💾 Database: PostgreSQL on ${configService.get('DB_HOST')}:${configService.get('DB_PORT')}         ║
  ║   ⚡ Cache: Redis on ${configService.get('REDIS_HOST')}:${configService.get('REDIS_PORT')}             ║
  ║   🤖 Telegram: ${configService.get('TELEGRAM_BOT_TOKEN') ? 'Connected' : 'Not configured'}                        ║
  ║   ⛓️  Blockchain: ${configService.get('TON_NETWORK')?.toUpperCase()}                         ║
  ║                                                           ║
  ╚═══════════════════════════════════════════════════════════╝
  `);
}

bootstrap();
