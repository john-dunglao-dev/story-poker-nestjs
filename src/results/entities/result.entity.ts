import { BaseEntity } from 'src/_database/entities/base.entity';
import { Room } from 'src/rooms/entities/room.entity';
import { Vote } from 'src/votes/entities/vote.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('results')
export class Result extends BaseEntity<Result> {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  roomId: number;

  @Column({ length: 255 })
  topic: string;

  constructor(result: Partial<Result>) {
    super();
    this.assign(result);
  }

  @ManyToOne(() => Room, { eager: false, nullable: false })
  @JoinColumn({ name: 'room_id' })
  room: Room;

  @OneToMany(() => Vote, (vote) => vote.result, { eager: false })
  votes: Vote[];
}
