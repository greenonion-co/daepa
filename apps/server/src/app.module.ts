import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PetController } from './pet/pet.controller';
import { PetService } from './pet/pet.service';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { PetEntity } from './pet/pet.entity';
import { ParentController } from './parent/parent.controller';
import { UserNotificationEntity } from './user_notification/user_notification.entity';
import { UserNotificationService } from './user_notification/user_notification.service';
import { UserNotificationController } from './user_notification/user_notification.controller';
import { BrPetController } from './pet/br/br.pet.controller';
import { ParentEntity } from './parent/parent.entity';
import { ParentService } from './parent/parent.service';
import { UserEntity } from './user/user.entity';
import { UserService } from './user/user.service';
import { EggEntity } from './egg/egg.entity';
import { EggController } from './egg/egg.controller';
import { EggService } from './egg/egg.service';
import { BrEggController } from './egg/br/br.egg.controller';
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

const ENTITIES = [
  UserEntity,
  OauthEntity,
  PetEntity,
  UserNotificationEntity,
  ParentEntity,
  EggEntity,
  AdoptionEntity,
  MatingEntity,
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
    ParentController,
    UserNotificationController,
    BrPetController,
    EggController,
    BrEggController,
    AuthController,
    UserController,
    AdoptionController,
    MatingController,
  ],
  providers: [
    AppService,
    UserService,
    OauthService,
    PetService,
    UserNotificationService,
    ParentService,
    EggService,
    AuthService,
    OauthService,
    KakaoStrategy,
    GoogleStrategy,
    JwtStrategy,
    AdoptionService,
    MatingService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {
  constructor(private dataSource: DataSource) {}
}
