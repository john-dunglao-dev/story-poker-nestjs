import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterRoomsModifySlug1769502552579 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE rooms MODIFY COLUMN slug VARCHAR(36) NOT NULL DEFAULT (UUID())`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE rooms MODIFY COLUMN slug VARCHAR(100) NOT NULL`,
    );
  }
}
