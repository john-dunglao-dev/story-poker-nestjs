import { BaseEntity } from 'src/_database/entities/base.entity';
import { Result } from 'src/results/entities/result.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity('votes')
export class Vote extends BaseEntity<Vote> {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  resultId: number;

  @Column()
  name: string;

  @Column()
  value: string;

  constructor(vote: Partial<Vote>) {
    super();
    this.assign(vote);
  }

  @ManyToOne(() => Result, (result) => result.votes, {
    eager: false,
    nullable: false,
  })
  result: Result;
}
