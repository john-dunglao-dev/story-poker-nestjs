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
import { AuthModule } from 'src/auth/auth.module';
import { WsAttendanceGuard } from './guards/ws-attendance.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Room]),
    ResultsModule,
    VotesModule,
    RedisModule,
    AuthModule,
  ],
  providers: [RoomsGateway, RoomsService, WsRoomsService, WsAttendanceGuard],
  controllers: [RoomsController],
})
export class RoomsModule {}
