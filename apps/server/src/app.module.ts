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

const ENTITIES = [PetEntity, UserNotificationEntity, ParentEntity];

@Module({
  imports: [
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
    }),
    TypeOrmModule.forFeature(ENTITIES),
  ],
  controllers: [
    AppController,
    PetController,
    ParentController,
    UserNotificationController,
    BrPetController,
  ],
  providers: [AppService, PetService, UserNotificationService, ParentService],
})
export class AppModule {
  constructor(private dataSource: DataSource) {}
}
