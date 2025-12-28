<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use App\Domain\Activity\WorldType;
use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20251103151328 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE Activity ADD COLUMN IF NOT EXISTS name VARCHAR(255) DEFAULT NULL');
        $this->addSql('ALTER TABLE Activity ADD COLUMN IF NOT EXISTS gearname VARCHAR(255) DEFAULT NULL');
        $this->addSql('UPDATE Activity set worldType = :worldType WHERE LOWER(devicename) = :deviceName', [
            'worldType' => WorldType::MY_WHOOSH->value,
            'deviceName' => 'mywhoosh',
        ]);
        $this->addSql("UPDATE Activity set worldType = :worldType WHERE LOWER(name) LIKE '%mywhoosh%'", [
            'worldType' => WorldType::MY_WHOOSH->value,
        ]);
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
    }
}
