import { Logger } from '@nestjs/common';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateResultsTable1769065971614 implements MigrationInterface {
  private readonly logger = new Logger(CreateResultsTable1769065971614.name);

  public async up(queryRunner: QueryRunner): Promise<void> {
    this.logger.log('Creating results table...');

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS results (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        room_id BIGINT UNSIGNED NOT NULL,
        topic VARCHAR(255) NULL DEFAULT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL
          DEFAULT CURRENT_TIMESTAMP
          ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL DEFAULT NULL,

        KEY idx_room_id (room_id),
        KEY idx_created_at (created_at),

        CONSTRAINT fk_room_id FOREIGN KEY (room_id) REFERENCES rooms(id)
          ON DELETE RESTRICT
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    this.logger.warn('Removing results table...');

    await queryRunner.query(`DROP TABLE IF EXISTS results;`);
  }
}
