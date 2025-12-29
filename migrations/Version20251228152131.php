<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20251228152131 extends AbstractMigration
{
    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE Activity ALTER COLUMN distance TYPE DOUBLE PRECISION');
        $this->addSql('ALTER TABLE Activity ALTER COLUMN elevation TYPE DOUBLE PRECISION');

        $this->addSql('ALTER TABLE Segment ALTER COLUMN distance TYPE DOUBLE PRECISION');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE Activity ALTER COLUMN distance TYPE INT');
        $this->addSql('ALTER TABLE Activity ALTER COLUMN elevation TYPE INT');

        $this->addSql('ALTER TABLE Segment ALTER COLUMN distance TYPE INT');
    }
}
