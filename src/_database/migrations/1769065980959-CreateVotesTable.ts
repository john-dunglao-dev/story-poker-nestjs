import { Logger } from '@nestjs/common';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateVotesTable1769065980959 implements MigrationInterface {
  private readonly logger = new Logger(CreateVotesTable1769065980959.name);

  public async up(queryRunner: QueryRunner): Promise<void> {
    this.logger.log('Creating votes table...');

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS votes (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        result_id BIGINT UNSIGNED NOT NULL,
        name VARCHAR(100) NOT NULL,
        value VARCHAR(100) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL
          DEFAULT CURRENT_TIMESTAMP
          ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL DEFAULT NULL,

        KEY idx_result_id (result_id),
        KEY idx_created_at (created_at),

        CONSTRAINT fk_result_id FOREIGN KEY (result_id) REFERENCES results(id)
          ON DELETE RESTRICT
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    this.logger.warn('Removing votes table...');

    await queryRunner.query(`DROP TABLE IF EXISTS votes;`);
  }
}
