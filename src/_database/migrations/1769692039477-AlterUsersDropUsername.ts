import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterUsersDropUsername1769692039477 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        ALTER TABLE users DROP COLUMN username;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        ALTER TABLE users ADD COLUMN username VARCHAR(50) AFTER id;
    `);
    await queryRunner.query(`
        ALTER TABLE users ADD CONSTRAINT uq_username UNIQUE (username);
    `);
  }
}
