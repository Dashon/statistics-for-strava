<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Add run_letters table for AI-generated reflective letters
 */
final class Version20251227000000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Create run_letters table to store AI-generated reflective letters for each activity';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE run_letters (
            activity_id VARCHAR(255) NOT NULL PRIMARY KEY,
            letter_text TEXT NOT NULL,
            edited_text TEXT DEFAULT NULL,
            generated_at INTEGER NOT NULL,
            edited_at INTEGER DEFAULT NULL,
            share_token VARCHAR(32) UNIQUE,
            is_public BOOLEAN DEFAULT FALSE,
            FOREIGN KEY (activity_id) REFERENCES Activity(activityid) ON DELETE CASCADE
        )');

        $this->addSql('CREATE INDEX idx_run_letters_generated_at ON run_letters(generated_at)');
        $this->addSql('CREATE INDEX idx_run_letters_share_token ON run_letters(share_token)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE IF EXISTS run_letters');
    }
}
