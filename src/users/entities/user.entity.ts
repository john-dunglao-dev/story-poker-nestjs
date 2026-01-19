import { hash } from 'argon2';
import { Exclude } from 'class-transformer';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column()
  username: string;

  @Index({ unique: true })
  @Column()
  email: string;

  @Exclude({ toPlainOnly: true })
  @Column()
  password: string;

  @Index()
  @Column({ default: true })
  isActive: boolean;

  @Index()
  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', select: false })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamp', select: false })
  deletedAt: Date | null;

  @Column({ nullable: true, type: 'timestamp' })
  validatedAt: Date | null;

  constructor(user: Partial<User>) {
    Object.assign(this, user);
  }

  @BeforeUpdate()
  @BeforeInsert()
  private async hashPassword() {
    if (this.password) {
      this.password = await hash(this.password);
    }
  }
}
