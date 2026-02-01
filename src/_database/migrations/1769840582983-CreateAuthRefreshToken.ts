import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAuthRefreshTokens1769840582983 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE auth_refresh_tokens (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        user_id BIGINT UNSIGNED NOT NULL,
        token VARCHAR(512) NOT NULL,
        ip_address VARCHAR(45) NULL DEFAULT NULL,
        user_agent VARCHAR(255) NULL DEFAULT NULL,
        is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
        expires_at TIMESTAMP NOT NULL,
        last_used_at TIMESTAMP NULL DEFAULT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        
        INDEX idx_user_id (user_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS auth_refresh_tokens`);
  }
}
