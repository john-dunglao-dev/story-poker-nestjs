import { Exclude } from 'class-transformer';
import { CreateDateColumn, DeleteDateColumn, UpdateDateColumn } from 'typeorm';

export abstract class BaseEntity<T> {
  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', nullable: true })
  updatedAt: Date | null;

  @Exclude({ toPlainOnly: true })
  @DeleteDateColumn({ type: 'timestamp', select: false })
  deletedAt: Date | null;

  assign(partial: Partial<T>) {
    Object.assign(this, partial);
  }
}
