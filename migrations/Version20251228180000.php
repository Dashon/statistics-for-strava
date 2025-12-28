<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Catch-all migration to ensure all required columns exist on PostgreSQL.
 * Some columns were added in SQLite-specific migrations and might be missing.
 */
final class Version20251228180000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Ensure all entity columns exist on PostgreSQL';
    }

    public function up(Schema $schema): void
    {
        // Only run on PostgreSQL
        if ($this->connection->getDatabasePlatform() instanceof \Doctrine\DBAL\Platforms\SqlitePlatform) {
            return;
        }

        // Activity Table Columns
        $this->addSql('ALTER TABLE Activity ADD COLUMN IF NOT EXISTS name VARCHAR(255) DEFAULT NULL');
        $this->addSql('ALTER TABLE Activity ADD COLUMN IF NOT EXISTS description VARCHAR(255) DEFAULT NULL');
        $this->addSql('ALTER TABLE Activity ADD COLUMN IF NOT EXISTS distance INTEGER DEFAULT NULL');
        $this->addSql('ALTER TABLE Activity ADD COLUMN IF NOT EXISTS elevation INTEGER DEFAULT NULL');
        $this->addSql('ALTER TABLE Activity ADD COLUMN IF NOT EXISTS calories INTEGER DEFAULT NULL');
        $this->addSql('ALTER TABLE Activity ADD COLUMN IF NOT EXISTS averagepower INTEGER DEFAULT NULL');
        $this->addSql('ALTER TABLE Activity ADD COLUMN IF NOT EXISTS maxpower INTEGER DEFAULT NULL');
        $this->addSql('ALTER TABLE Activity ADD COLUMN IF NOT EXISTS averagespeed DOUBLE PRECISION DEFAULT NULL');
        $this->addSql('ALTER TABLE Activity ADD COLUMN IF NOT EXISTS maxspeed DOUBLE PRECISION DEFAULT NULL');
        $this->addSql('ALTER TABLE Activity ADD COLUMN IF NOT EXISTS averageheartrate INTEGER DEFAULT NULL');
        $this->addSql('ALTER TABLE Activity ADD COLUMN IF NOT EXISTS maxheartrate INTEGER DEFAULT NULL');
        $this->addSql('ALTER TABLE Activity ADD COLUMN IF NOT EXISTS averagecadence INTEGER DEFAULT NULL');
        $this->addSql('ALTER TABLE Activity ADD COLUMN IF NOT EXISTS movingtimeinseconds INTEGER DEFAULT NULL');
        $this->addSql('ALTER TABLE Activity ADD COLUMN IF NOT EXISTS kudocount INTEGER DEFAULT NULL');
        $this->addSql('ALTER TABLE Activity ADD COLUMN IF NOT EXISTS devicename VARCHAR(255) DEFAULT NULL');
        $this->addSql('ALTER TABLE Activity ADD COLUMN IF NOT EXISTS totalimagecount INTEGER DEFAULT NULL');
        $this->addSql('ALTER TABLE Activity ADD COLUMN IF NOT EXISTS localimagepaths TEXT DEFAULT NULL');
        $this->addSql('ALTER TABLE Activity ADD COLUMN IF NOT EXISTS polyline TEXT DEFAULT NULL');
        $this->addSql('ALTER TABLE Activity ADD COLUMN IF NOT EXISTS weather TEXT DEFAULT NULL');
        $this->addSql('ALTER TABLE Activity ADD COLUMN IF NOT EXISTS gearid VARCHAR(255) DEFAULT NULL');
        $this->addSql('ALTER TABLE Activity ADD COLUMN IF NOT EXISTS iscommute BOOLEAN DEFAULT NULL');
        $this->addSql('ALTER TABLE Activity ADD COLUMN IF NOT EXISTS workouttype VARCHAR(255) DEFAULT NULL');
        $this->addSql('ALTER TABLE Activity ADD COLUMN IF NOT EXISTS startingcoordinatelatitude DOUBLE PRECISION DEFAULT NULL');
        $this->addSql('ALTER TABLE Activity ADD COLUMN IF NOT EXISTS startingcoordinatelongitude DOUBLE PRECISION DEFAULT NULL');
        $this->addSql('ALTER TABLE Activity ADD COLUMN IF NOT EXISTS routegeography JSONB DEFAULT NULL');
        $this->addSql('ALTER TABLE Activity ADD COLUMN IF NOT EXISTS markedfordeletion BOOLEAN DEFAULT NULL');
        $this->addSql('ALTER TABLE Activity ADD COLUMN IF NOT EXISTS streamsareimported BOOLEAN DEFAULT NULL');

        // Segment Table Columns
        $this->addSql('ALTER TABLE Segment ADD COLUMN IF NOT EXISTS sporttype VARCHAR(255) DEFAULT NULL');
        $this->addSql('ALTER TABLE Segment ADD COLUMN IF NOT EXISTS name VARCHAR(255) DEFAULT NULL');
        $this->addSql('ALTER TABLE Segment ADD COLUMN IF NOT EXISTS distance INTEGER DEFAULT NULL');
        $this->addSql('ALTER TABLE Segment ADD COLUMN IF NOT EXISTS maxgradient DOUBLE PRECISION DEFAULT NULL');
        $this->addSql('ALTER TABLE Segment ADD COLUMN IF NOT EXISTS isfavourite BOOLEAN DEFAULT NULL');
        $this->addSql('ALTER TABLE Segment ADD COLUMN IF NOT EXISTS climbcategory INTEGER DEFAULT NULL');
        $this->addSql('ALTER TABLE Segment ADD COLUMN IF NOT EXISTS devicename VARCHAR(255) DEFAULT NULL');
        $this->addSql('ALTER TABLE Segment ADD COLUMN IF NOT EXISTS countrycode VARCHAR(255) DEFAULT NULL');
        $this->addSql('ALTER TABLE Segment ADD COLUMN IF NOT EXISTS detailshavebeenimported BOOLEAN DEFAULT NULL');
        $this->addSql('ALTER TABLE Segment ADD COLUMN IF NOT EXISTS polyline TEXT DEFAULT NULL');
        $this->addSql('ALTER TABLE Segment ADD COLUMN IF NOT EXISTS startingcoordinatelatitude DOUBLE PRECISION DEFAULT NULL');
        $this->addSql('ALTER TABLE Segment ADD COLUMN IF NOT EXISTS startingcoordinatelongitude DOUBLE PRECISION DEFAULT NULL');

        // SegmentEffort Table Columns
        $this->addSql('ALTER TABLE SegmentEffort ADD COLUMN IF NOT EXISTS name VARCHAR(255) DEFAULT NULL');
        $this->addSql('ALTER TABLE SegmentEffort ADD COLUMN IF NOT EXISTS elapsedtimeinseconds DOUBLE PRECISION DEFAULT NULL');
        $this->addSql('ALTER TABLE SegmentEffort ADD COLUMN IF NOT EXISTS distance INTEGER DEFAULT NULL');
        $this->addSql('ALTER TABLE SegmentEffort ADD COLUMN IF NOT EXISTS averagewatts DOUBLE PRECISION DEFAULT NULL');

        // Gear Table Columns
        $this->addSql('ALTER TABLE Gear ADD COLUMN IF NOT EXISTS name VARCHAR(255) DEFAULT NULL');
        $this->addSql('ALTER TABLE Gear ADD COLUMN IF NOT EXISTS isretired BOOLEAN DEFAULT NULL');
        $this->addSql('ALTER TABLE Gear ADD COLUMN IF NOT EXISTS type VARCHAR(255) DEFAULT \'imported\'');

        // Challenge Table Columns
        $this->addSql('ALTER TABLE Challenge ADD COLUMN IF NOT EXISTS name VARCHAR(255) DEFAULT NULL');
        $this->addSql('ALTER TABLE Challenge ADD COLUMN IF NOT EXISTS logourl VARCHAR(255) DEFAULT NULL');
        $this->addSql('ALTER TABLE Challenge ADD COLUMN IF NOT EXISTS locallogourl VARCHAR(255) DEFAULT NULL');
        $this->addSql('ALTER TABLE Challenge ADD COLUMN IF NOT EXISTS slug VARCHAR(255) DEFAULT NULL');

        // ActivityBestEffort Table Columns (already has most, but ensuring)
        $this->addSql('ALTER TABLE ActivityBestEffort ADD COLUMN IF NOT EXISTS distanceinmeter INTEGER DEFAULT NULL');
        $this->addSql('ALTER TABLE ActivityBestEffort ADD COLUMN IF NOT EXISTS sporttype VARCHAR(255) DEFAULT NULL');
        $this->addSql('ALTER TABLE ActivityBestEffort ADD COLUMN IF NOT EXISTS timeinseconds INTEGER DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        // No down migration for safety
    }
}
