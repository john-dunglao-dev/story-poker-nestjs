import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterUsersAddName1769692221661 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        ALTER TABLE users ADD COLUMN name VARCHAR(255) AFTER id;
    `);
    await queryRunner.query(`
        CREATE INDEX idx_name ON users (name);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        ALTER TABLE users DROP COLUMN name;
    `);
  }
}
