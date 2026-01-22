import { Module } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { RoomsGateway } from './rooms.gateway';
import { RoomsController } from './rooms.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Room } from './entities/room.entity';
import { WsRoomsService } from './ws-rooms.service';
import { ResultsModule } from 'src/results/results.module';
import { VotesModule } from 'src/votes/votes.module';
import { RedisModule } from 'src/redis/redis.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Room]),
    ResultsModule,
    VotesModule,
    RedisModule,
  ],
  providers: [RoomsGateway, RoomsService, WsRoomsService],
  controllers: [RoomsController],
})
export class RoomsModule {}
