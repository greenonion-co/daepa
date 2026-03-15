import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CacheService } from './common/cache.service';
import { CacheInvalidation } from './common/cache-invalidation';
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
import { PetAdoptionEntity } from './pet_adoption/pet_adoption.entity';
import { AdoptionHistoryEntity } from './adoption_history/adoption_history.entity';
import { PetAdoptionController } from './pet_adoption/pet_adoption.controller';
import { PetAdoptionService } from './pet_adoption/pet_adoption.service';
import { AdoptionHistoryController } from './adoption_history/adoption_history.controller';
import { AdoptionHistoryService } from './adoption_history/adoption_history.service';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { MatingController } from './mating/mating.controller';
import { MatingService } from './mating/mating.service';
import { MatingEntity } from './mating/mating.entity';
import { ParentRequestEntity } from './parent_request/parent_request.entity';
import { ParentRequestService } from './parent_request/parent_request.service';
import { ParentRequestController } from './parent_request/parent_request.controller';
import { LayingEntity } from './laying/laying.entity';
import { LayingController } from './laying/laying.controller';
import { LayingService } from './laying/laying.service';
import { PairEntity } from './pair/pair.entity';
import { R2Service } from './common/cloudflare/r2.service';
import { PetImageEntity } from './pet_image/pet_image.entity';
import { PetImageService } from './pet_image/pet_image.service';
import { PetImageController } from './pet_image/pet_image.controller';
import { EggDetailEntity } from './egg_detail/egg_detail.entity';
import { PetDetailEntity } from './pet_detail/pet_detail.entity';
import { PairController } from './pair/pair.controller';
import { PairService } from './pair/pair.service';
import { PetRelationEntity } from './pet_relation/pet_relation.entity';
import { PetRelationService } from './pet_relation/pet_relation.service';
import { StatisticsController } from './statistics/statistics.controller';
import { StatisticsService } from './statistics/statistics.service';
import { FcmModule } from './fcm/fcm.module';
import { FcmTokenEntity } from './fcm/fcm_token.entity';
import { FeedingEntity } from './feeding/feeding.entity';
import { FeedingController } from './feeding/feeding.controller';
import { FeedingService } from './feeding/feeding.service';

const ENTITIES = [
  UserEntity,
  OauthEntity,
  PetEntity,
  UserNotificationEntity,
  PetAdoptionEntity,
  AdoptionHistoryEntity,
  MatingEntity,
  ParentRequestEntity,
  LayingEntity,
  PairEntity,
  PetImageEntity,
  PetDetailEntity,
  EggDetailEntity,
  PetRelationEntity,
  FcmTokenEntity,
  FeedingEntity,
];

@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => ({
        store: await redisStore({
          socket: {
            host: process.env.REDIS_HOST || 'localhost',
            port: Number(process.env.REDIS_PORT) || 6379,
            connectTimeout: 3000,
            reconnectStrategy: (retries: number) =>
              Math.min(retries * 200, 3000),
          },
          password: process.env.REDIS_PASSWORD || undefined,
        }),
      }),
    }),
    HttpModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath:
        process.env.NODE_ENV === 'production'
          ? '.env.production'
          : '.env.local',
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
    FcmModule,
  ],
  controllers: [
    AppController,
    PetController,
    UserNotificationController,
    BrPetController,
    AuthController,
    UserController,
    PetAdoptionController,
    AdoptionHistoryController,
    MatingController,
    ParentRequestController,
    LayingController,
    PairController,
    PetImageController,
    StatisticsController,
    FeedingController,
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
    PetAdoptionService,
    AdoptionHistoryService,
    MatingService,
    ParentRequestService,
    LayingService,
    R2Service,
    PetImageService,
    PairService,
    PetRelationService,
    StatisticsService,
    FeedingService,
    CacheService,
    CacheInvalidation,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {
  constructor(private dataSource: DataSource) {}
}
