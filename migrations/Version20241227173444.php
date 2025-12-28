<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20241227173444 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $platform = $this->connection->getDatabasePlatform();

        if ($platform instanceof \Doctrine\DBAL\Platforms\SqlitePlatform) {
            // SQLite: Use temp tables and JSON_EXTRACT
            $this->addSql('CREATE TEMPORARY TABLE __temp__Activity AS SELECT activityId, startDateTime, data, gearId, weather, location FROM Activity');
            $this->addSql('DROP TABLE Activity');
            $this->addSql('CREATE TABLE Activity (activityId VARCHAR(255) NOT NULL, startDateTime TIMESTAMP NOT NULL --(DC2Type:datetime_immutable)
            , data TEXT NOT NULL --(DC2Type:json)
            , gearId VARCHAR(255) DEFAULT NULL, weather TEXT DEFAULT NULL --(DC2Type:json)
            , location TEXT DEFAULT NULL --(DC2Type:json)
            , activityType VARCHAR(255) DEFAULT NULL, PRIMARY KEY(activityId))');
            $this->addSql('INSERT INTO Activity (activityId, startDateTime, data, gearId, weather, location) SELECT activityId, startDateTime, data, gearId, weather, location FROM __temp__Activity');
            $this->addSql('DROP TABLE __temp__Activity');
            $this->addSql('UPDATE Activity SET activityType = JSON_EXTRACT(data, "$.type")');
        } else {
            // PostgreSQL: Just add the column (no data to migrate on fresh DB)
            $this->addSql('ALTER TABLE Activity ADD COLUMN IF NOT EXISTS activityType VARCHAR(255) DEFAULT NULL');
            // If there was data, we'd use: UPDATE Activity SET activityType = data->>\'type\'
        }
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TEMPORARY TABLE __temp__Activity AS SELECT activityId, startDateTime, data, location, weather, gearId FROM Activity');
        $this->addSql('DROP TABLE Activity');
        $this->addSql('CREATE TABLE Activity (activityId VARCHAR(255) NOT NULL, startDateTime TIMESTAMP NOT NULL --(DC2Type:datetime_immutable)
        , data TEXT NOT NULL --(DC2Type:json)
        , location TEXT DEFAULT NULL, weather TEXT DEFAULT NULL, gearId VARCHAR(255) DEFAULT NULL, PRIMARY KEY(activityId))');
        $this->addSql('INSERT INTO Activity (activityId, startDateTime, data, location, weather, gearId) SELECT activityId, startDateTime, data, location, weather, gearId FROM __temp__Activity');
        $this->addSql('DROP TABLE __temp__Activity');
    }
}
