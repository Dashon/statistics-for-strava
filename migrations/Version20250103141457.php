<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20250103141457 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // Skip SQLite-specific data migration on PostgreSQL
        if (!($this->connection->getDatabasePlatform() instanceof \Doctrine\DBAL\Platforms\SqlitePlatform)) {
            return;
        }

        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE Activity RENAME COLUMN activityType TO sportType');
        $this->addSql('UPDATE Activity SET sportType = JSON_EXTRACT(data, "$.sport_type")');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE Activity RENAME COLUMN sportType TO activityType');
    }
}
