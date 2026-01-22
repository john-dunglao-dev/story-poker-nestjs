import { hash } from 'argon2';
import { Exclude } from 'class-transformer';
import { BaseEntity } from 'src/_database/entities/base.entity';
import { Room } from 'src/rooms/entities/room.entity';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('users')
export class User extends BaseEntity<User> {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  username: string;

  @Column()
  email: string;

  @Exclude({ toPlainOnly: true })
  @Column()
  password: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true, type: 'timestamp' })
  validatedAt: Date | null;

  constructor(user: Partial<User>) {
    super();
    this.assign(user);
  }

  @BeforeUpdate()
  @BeforeInsert()
  private async hashPassword() {
    if (this.password) {
      this.password = await hash(this.password);
    }
  }

  @OneToMany(() => Room, (room) => room.user, { eager: false })
  rooms: Room[];
}
