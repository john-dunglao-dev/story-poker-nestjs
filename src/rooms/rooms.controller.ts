import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ClassSerializerInterceptor,
  UseInterceptors,
} from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { Public } from 'src/_decorators/public.decorator';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post()
  async create(@Body() createRoomDto: CreateRoomDto) {
    return this.roomsService.create(createRoomDto);
  }

  @Get()
  findAll() {
    return this.roomsService.findAll();
  }

  @Public()
  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.roomsService.findOne({ slug });
  }

  @Patch(':slug')
  update(@Param('slug') slug: string, @Body() updateRoomDto: UpdateRoomDto) {
    return this.roomsService.update(slug, updateRoomDto);
  }

  @Delete(':slug')
  remove(@Param('slug') slug: string) {
    return this.roomsService.remove(slug);
  }
}
