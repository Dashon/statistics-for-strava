<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use App\Domain\Activity\ActivityType;
use App\Domain\Activity\SportType\SportType;
use Doctrine\DBAL\ArrayParameterType;
use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20250714071904 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // Skip on PostgreSQL - this migration is designed for SQLite data migration
        // On PostgreSQL, activityType was already added in Version20241227173444
        // and sportType column doesn't exist (it was never created on PostgreSQL)
        if (!($this->connection->getDatabasePlatform() instanceof \Doctrine\DBAL\Platforms\SqlitePlatform)) {
            return;
        }

        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE Activity ADD COLUMN IF NOT EXISTS activityType VARCHAR(255) DEFAULT NULL');
        foreach (ActivityType::cases() as $activityType) {
            $this->addSql(
                'UPDATE Activity SET activityType = :activityType WHERE sportType IN (:sportTypes)',
                [
                    'activityType' => $activityType->value,
                    'sportTypes' => $activityType->getSportTypes()->map(fn (SportType $sportType) => $sportType->value),
                ],
                [
                    'sportTypes' => ArrayParameterType::STRING,
                ]
            );
        }
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
    }
}
