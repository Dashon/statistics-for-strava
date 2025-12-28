<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use App\Domain\Activity\ActivityType;
use App\Domain\Activity\WorldType;
use Doctrine\DBAL\ArrayParameterType;
use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20251012151344 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs.
        $this->addSql('ALTER TABLE Activity ADD COLUMN IF NOT EXISTS worldType VARCHAR(255) DEFAULT NULL');
        $this->addSql('ALTER TABLE Activity ADD COLUMN IF NOT EXISTS devicename VARCHAR(255) DEFAULT NULL');
        $this->addSql('ALTER TABLE Activity ADD COLUMN IF NOT EXISTS activitytype VARCHAR(255) DEFAULT NULL');
        $this->addSql('ALTER TABLE Activity ADD COLUMN IF NOT EXISTS name VARCHAR(255) DEFAULT NULL');
        $this->addSql('ALTER TABLE Activity ADD COLUMN IF NOT EXISTS gearname VARCHAR(255) DEFAULT NULL');
        $this->addSql('UPDATE Activity set worldType = :worldType', [
            'worldType' => WorldType::REAL_WORLD->value,
        ]);
        $this->addSql('UPDATE Activity set worldType = :worldType WHERE LOWER(devicename) = :deviceName', [
            'worldType' => WorldType::ZWIFT->value,
            'deviceName' => 'zwift',
        ]);
        $this->addSql('UPDATE Activity set worldType = :worldType WHERE LOWER(devicename) = :deviceName', [
            'worldType' => WorldType::ROUVY->value,
            'deviceName' => 'rouvy',
        ]);

        $activityIds = $this->connection->fetchFirstColumn(
            <<<'SQL'
                SELECT activityid FROM Activity WHERE activitytype = :activityType
            SQL,
            [
                'activityType' => ActivityType::RUN->value,
            ]
        );

        if (0 === count($activityIds)) {
            return;
        }

        $this->addSql(<<<'SQL'
            DELETE FROM CombinedActivityStream
            WHERE activityid IN(:activityIds)
        SQL,
            [
                'activityIds' => $activityIds,
            ],
            [
                'activityIds' => ArrayParameterType::STRING,
            ],
        );
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
    }
}
