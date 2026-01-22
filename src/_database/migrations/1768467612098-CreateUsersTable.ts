import { Logger } from '@nestjs/common';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsersTable1768467612098 implements MigrationInterface {
  private readonly logger = new Logger(CreateUsersTable1768467612098.name);

  public async up(queryRunner: QueryRunner): Promise<void> {
    this.logger.log('Creating users table in the database:');
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS users (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL
          DEFAULT CURRENT_TIMESTAMP
          ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL DEFAULT NULL,
        validated_at TIMESTAMP NULL DEFAULT NULL,

        UNIQUE KEY uq_username (username),
        UNIQUE KEY uq_email (email),
        KEY idx_is_active (is_active),
        KEY idx_created_at (created_at)
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    this.logger.warn('Reverting changes: Dropping users table if exists.');
    await queryRunner.query('DROP TABLE IF EXISTS users');
  }
}
