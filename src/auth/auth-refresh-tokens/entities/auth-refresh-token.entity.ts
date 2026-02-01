import { User } from 'src/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('auth_refresh_tokens')
export class AuthRefreshToken {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column({ length: 512 })
  token: string;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  userAgent?: string;

  @Column({ default: false })
  isRevoked: boolean;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastUsedAt?: Date;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  constructor(partial: Partial<AuthRefreshToken>) {
    Object.assign(this, partial);
  }

  @ManyToOne(() => User, (user) => user.authRefreshTokens, {
    eager: false,
  })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
