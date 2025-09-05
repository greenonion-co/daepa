import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PetController } from './pet/pet.controller';
import { PetService } from './pet/pet.service';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { PetEntity } from './pet/pet.entity';
import { UserNotificationEntity } from './user_notification/user_notification.entity';
import { UserNotificationService } from './user_notification/user_notification.service';
import { UserNotificationController } from './user_notification/user_notification.controller';
import { BrPetController } from './pet/br/br.pet.controller';
import { UserEntity } from './user/user.entity';
import { UserService } from './user/user.service';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { KakaoStrategy } from './auth/strategies/kakao.strategy';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './auth/strategies/jwt.strategy';
import { JwtModule } from '@nestjs/jwt';
import { GoogleStrategy } from './auth/strategies/google.strategy';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/auth.decorator';
import { HttpModule } from '@nestjs/axios';
import { OauthService } from './auth/oauth/oauth.service';
import { UserController } from './user/user.controller';
import { OauthEntity } from './auth/oauth/oauth.entity';
import { AdoptionEntity } from './adoption/adoption.entity';
import { AdoptionController } from './adoption/adoption.controller';
import { AdoptionService } from './adoption/adoption.service';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { MatingController } from './mating/mating.controller';
import { MatingService } from './mating/mating.service';
import { MatingEntity } from './mating/mating.entity';
import { BrMatingController } from './mating/br/br.mating.controller';
import { ParentRequestEntity } from './parent_request/parent_request.entity';
import { ParentRequestService } from './parent_request/parent_request.service';
import { ParentRequestController } from './parent_request/parent_request.controller';
import { LayingEntity } from './laying/laying.entity';
import { LayingController } from './laying/laying.controller';
import { LayingService } from './laying/laying.service';
import { PairEntity } from './pair/pair.entity';
import { PairController } from './pair/pair.controller';
import { PairService } from './pair/pair.service';
import { FileController } from './file/file.controller';
import { FileService } from './file/file.service';
import { R2Service } from './common/cloudflare/r2.service';
import { PetImageEntity } from './pet_image/pet_image.entity';
import { PetImageService } from './pet_image/pet_image.service';
import { BrUserController } from './user/br/br.user.controller';

const ENTITIES = [
  UserEntity,
  OauthEntity,
  PetEntity,
  UserNotificationEntity,
  AdoptionEntity,
  MatingEntity,
  ParentRequestEntity,
  LayingEntity,
  PairEntity,
  PetImageEntity,
];

@Module({
  imports: [
    HttpModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.MYSQL_HOST,
      port: parseInt(process.env.MYSQL_PORT ?? '', 10) || 3306,
      username: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      entities: ENTITIES,
      synchronize: true,
      namingStrategy: new SnakeNamingStrategy(),
    }),
    TypeOrmModule.forFeature(ENTITIES),
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? '',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [
    AppController,
    PetController,
    UserNotificationController,
    BrPetController,
    AuthController,
    UserController,
    AdoptionController,
    MatingController,
    BrMatingController,
    ParentRequestController,
    LayingController,
    PairController,
    FileController,
    BrUserController,
  ],
  providers: [
    AppService,
    UserService,
    PetService,
    UserNotificationService,
    AuthService,
    OauthService,
    KakaoStrategy,
    GoogleStrategy,
    JwtStrategy,
    AdoptionService,
    MatingService,
    ParentRequestService,
    LayingService,
    PairService,
    R2Service,
    FileService,
    PetImageService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {
  constructor(private dataSource: DataSource) {}
}
