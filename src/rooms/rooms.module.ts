import { Module } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { RoomsGateway } from './rooms.gateway';
import { RoomsController } from './rooms.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Room } from './entities/room.entity';
import { WsRoomsService } from './ws-rooms.service';

@Module({
  imports: [TypeOrmModule.forFeature([Room])],
  providers: [RoomsGateway, RoomsService, WsRoomsService],
  controllers: [RoomsController],
})
export class RoomsModule {}
