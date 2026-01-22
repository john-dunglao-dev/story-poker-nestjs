import { Logger } from '@nestjs/common';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRoomsTable1768467632605 implements MigrationInterface {
  private readonly logger = new Logger(CreateRoomsTable1768467632605.name);

  public async up(queryRunner: QueryRunner): Promise<void> {
    this.logger.log('Checking existing rooms in the database:');
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS rooms (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        slug VARCHAR(100) NOT NULL,
        user_id BIGINT UNSIGNED,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL
          DEFAULT CURRENT_TIMESTAMP
          ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL DEFAULT NULL,

        UNIQUE KEY uq_room_slug_by_host (slug, user_id, deleted_at),
        KEY idx_user_id (user_id),
        KEY idx_is_active (is_active),
        KEY idx_created_at (created_at),

        CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES users(id)
          ON DELETE RESTRICT
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    this.logger.warn('Reverting changes: Dropping rooms table if exists.');
    await queryRunner.query('DROP TABLE IF EXISTS rooms');
  }
}
