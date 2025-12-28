<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20251210175326 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // Skip SQLite-specific JSON_SET function on PostgreSQL
        if ($this->connection->getDatabasePlatform() instanceof \Doctrine\DBAL\Platforms\SqlitePlatform) {
            $this->addSql('UPDATE Activity SET location = JSON_SET(location, "$.is_reverse_geocoded", true) WHERE location IS NOT NULL');
        } else {
            // PostgreSQL: Use jsonb_set
            $this->addSql("UPDATE Activity SET location = jsonb_set(location::jsonb, '{is_reverse_geocoded}', 'true'::jsonb) WHERE location IS NOT NULL");
        }

        $this->addSql('ALTER TABLE Activity RENAME COLUMN location TO routegeography');
        $this->addSql('ALTER TABLE Activity DROP COLUMN IF EXISTS gearname');
    }

    public function down(Schema $schema): void
    {
    }
}
