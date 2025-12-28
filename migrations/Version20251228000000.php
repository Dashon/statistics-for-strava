<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Migration to add sporttype column to Activity table on PostgreSQL.
 *
 * This column was missing from PostgreSQL migrations because previous migrations
 * that created it were SQLite-only. The Activity entity requires this column.
 */
final class Version20251228000000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add missing columns (sporttype, devicename) to Activity table on PostgreSQL and populate from JSON data';
    }

    public function up(Schema $schema): void
    {
        // Only run on PostgreSQL - SQLite already has these columns
        if ($this->connection->getDatabasePlatform() instanceof \Doctrine\DBAL\Platforms\SqlitePlatform) {
            return;
        }

        // Add sporttype column
        $this->addSql('ALTER TABLE Activity ADD COLUMN IF NOT EXISTS sporttype VARCHAR(255) DEFAULT NULL');

        // Populate sporttype from the JSON data column (data->>'sport_type')
        // This handles existing data that was imported before this migration
        $this->addSql("UPDATE Activity SET sporttype = data::jsonb->>'sport_type' WHERE sporttype IS NULL AND data::jsonb->>'sport_type' IS NOT NULL");

        // Create index on sporttype for performance
        $this->addSql('CREATE INDEX IF NOT EXISTS activity_sporttype ON Activity (sporttype)');

        // Add devicename column (was only created in SQLite-only migrations)
        $this->addSql('ALTER TABLE Activity ADD COLUMN IF NOT EXISTS devicename VARCHAR(255) DEFAULT NULL');

        // Populate devicename from JSON data
        $this->addSql("UPDATE Activity SET devicename = data::jsonb->>'device_name' WHERE devicename IS NULL AND data::jsonb->>'device_name' IS NOT NULL");
    }

    public function down(Schema $schema): void
    {
        // Only run on PostgreSQL
        if ($this->connection->getDatabasePlatform() instanceof \Doctrine\DBAL\Platforms\SqlitePlatform) {
            return;
        }

        $this->addSql('DROP INDEX IF EXISTS activity_sporttype');
        $this->addSql('ALTER TABLE Activity DROP COLUMN IF EXISTS sporttype');
        $this->addSql('ALTER TABLE Activity DROP COLUMN IF EXISTS devicename');
    }
}
