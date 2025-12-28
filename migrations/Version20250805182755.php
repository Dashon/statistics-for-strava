<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20250805182755 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE Segment ADD COLUMN IF NOT EXISTS detailsHaveBeenImported BOOLEAN DEFAULT NULL');
        $this->addSql('UPDATE segment SET detailsHaveBeenImported = 0');
        $this->addSql('ALTER TABLE Segment ADD COLUMN IF NOT EXISTS polyline TEXT DEFAULT NULL');
        $this->addSql('ALTER TABLE Segment ADD COLUMN IF NOT EXISTS startingCoordinateLatitude DOUBLE PRECISION DEFAULT NULL');
        $this->addSql('ALTER TABLE Segment ADD COLUMN IF NOT EXISTS startingCoordinateLongitude DOUBLE PRECISION DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
    }
}
