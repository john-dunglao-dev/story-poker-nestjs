import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterVotesAddSlug1769506164905 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE votes ADD COLUMN slug VARCHAR(100) NULL DEFAULT NULL AFTER name`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE votes DROP COLUMN slug`);
  }
}
