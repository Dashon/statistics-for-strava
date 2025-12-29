<?php

namespace App\Domain\Letter;

use Doctrine\DBAL\Connection;
use App\Infrastructure\ValueObject\Time\SerializableDateTime;

use App\Infrastructure\Repository\ProvidesDatabaseDateFormat;

final readonly class StreakCalculator
{
    use ProvidesDatabaseDateFormat;

    public function __construct(
        private Connection $connection,
    ) {
    }

    /**
     * Calculate the current streak (consecutive days with at least one activity).
     */
    public function getCurrentStreakDay(?SerializableDateTime $upToDate = null): int
    {
        $upToDate ??= new SerializableDateTime('now');

        $daySql = $this->getDateFormatSql($this->connection, 'startDateTime', '%Y-%m-%d');

        // Get all activity days ordered desc
        $days = $this->connection->executeQuery(
            <<<SQL
                SELECT DISTINCT {$daySql} as day
                FROM Activity
                ORDER BY day DESC
            SQL
        )->fetchFirstColumn();

        if (empty($days)) {
            return 0;
        }

        $today = $upToDate->format('Y-m-d');
        $yesterday = $upToDate->modify('-1 day')->format('Y-m-d');

        // Streak can start today or yesterday
        $latestActivityDay = $days[0];
        if ($latestActivityDay !== $today && $latestActivityDay !== $yesterday) {
            return 0; // Streak broken
        }

        // Count consecutive days backwards
        $streak = 1;
        $expectedDate = SerializableDateTime::fromString($latestActivityDay);

        for ($i = 1; $i < count($days); ++$i) {
            $expectedDate = $expectedDate->modify('-1 day');
            $expectedDay = $expectedDate->format('Y-m-d');

            if ($days[$i] === $expectedDay) {
                ++$streak;
            } else {
                break;
            }
        }

        return $streak;
    }
}
