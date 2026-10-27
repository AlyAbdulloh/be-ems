import { NestFactory } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";
import { TransformInterceptor } from "./common/interceptors/transform.interceptor";
import { LoggingInterceptor } from "./common/interceptors/logging.interceptor";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { NestExpressApplication } from "@nestjs/platform-express";
import { join } from "path";
import cookieParser from "cookie-parser";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  // Serve static uploaded assets (e.g. event banners)
  app.useStaticAssets(join(process.cwd(), "uploads"), {
    prefix: "/uploads/",
  });

  // Enable Cookie Parser
  app.use(cookieParser());

  // Set global prefix for all endpoints
  app.setGlobalPrefix("api");

  // Enable CORS. Use a comma-separated allowlist in production.
  const allowedOrigins = (configService.get<string>("CORS_ORIGINS") ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : true,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    credentials: true,
  });

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Global Exceptions Filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Global Interceptors
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TransformInterceptor(),
  );

  // Swagger Documentation Setup
  const config = new DocumentBuilder()
    .setTitle("EMS REST API")
    .setDescription("Event Management System API documentation")
    .setVersion("1.0")
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("docs", app, document, {
    useGlobalPrefix: true,
  });

  const port = Number(configService.get<string>("PORT") ?? 3000);
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(
    `Swagger documentation available at: http://localhost:${port}/api/docs`,
  );
}
void bootstrap();
