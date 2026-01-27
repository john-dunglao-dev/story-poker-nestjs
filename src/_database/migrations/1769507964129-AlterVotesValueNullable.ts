import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterVotesValueNullable1769507964129 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE votes MODIFY COLUMN value VARCHAR(100) NULL DEFAULT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE votes MODIFY COLUMN value VARCHAR(100) NOT NULL`,
    );
  }
}
