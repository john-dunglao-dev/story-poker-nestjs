import { BaseEntity } from 'src/_database/entities/base.entity';
import { Result } from 'src/results/entities/result.entity';
import { User } from 'src/users/entities/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('rooms')
export class Room extends BaseEntity<Room> {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'uuid', default: () => 'UUID()' })
  slug: string;

  @Column()
  userId: number;

  @Column({ default: true })
  isActive: boolean;

  constructor(room: Partial<Room>) {
    super();
    this.assign(room);
  }

  @ManyToOne(() => User, (user) => user.rooms, {
    eager: false,
    nullable: false,
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => Result, (result) => result.room, { eager: false })
  results: Result[];
}
