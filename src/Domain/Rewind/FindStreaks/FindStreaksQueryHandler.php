<?php

declare(strict_types=1);

namespace App\Domain\Rewind\FindStreaks;

use App\Infrastructure\CQRS\Query\Query;
use App\Infrastructure\CQRS\Query\QueryHandler;
use App\Infrastructure\CQRS\Query\Response;
use App\Infrastructure\ValueObject\Time\SerializableDateTime;
use Doctrine\DBAL\ArrayParameterType;
use Doctrine\DBAL\Connection;

use App\Infrastructure\Repository\ProvidesDatabaseDateFormat;

final readonly class FindStreaksQueryHandler implements QueryHandler
{
    use ProvidesDatabaseDateFormat;

    public function __construct(
        private Connection $connection,
    ) {
    }

    public function handle(Query $query): Response
    {
        assert($query instanceof FindStreaks);

        $daySql = $this->getDateFormatSql($this->connection, 'startDateTime', '%Y-%m-%d');
        $yearSql = $this->getDateFormatSql($this->connection, 'startDateTime', '%Y');

        /** @var string[] $days */
        $days = $this->connection->executeQuery(
            <<<SQL
                SELECT {$daySql} as day
                FROM activity
                WHERE {$yearSql} IN (:years)
                GROUP BY day
                ORDER BY day ASC
            SQL,
            [
                'years' => array_map(strval(...), $query->getYears()->toArray()),
            ],
            [
                'years' => ArrayParameterType::STRING,
            ]
        )->fetchFirstColumn();

        $weekSql = $this->getDateFormatSql($this->connection, 'startDateTime', '%W');

        /** @var array<int, array{'year': int, 'week': int}> $weeksAndYears */
        $weeksAndYears = $this->connection->executeQuery(
            <<<SQL
                SELECT CAST({$weekSql} AS INTEGER) as week,
                       CAST({$yearSql} AS INTEGER) as year
                FROM activity
                WHERE {$yearSql} IN (:years)
                GROUP BY year, week
                ORDER BY year ASC, week ASC
            SQL,
            [
                'years' => array_map(strval(...), $query->getYears()->toArray()),
            ],
            [
                'years' => ArrayParameterType::STRING,
            ]
        )->fetchAllAssociative();

        $monthSql = $this->getDateFormatSql($this->connection, 'startDateTime', '%m');

        /** @var int[] $months */
        $months = array_map(intval(...), $this->connection->executeQuery(
            <<<SQL
                SELECT CAST({$yearSql} AS INTEGER) * 12 + CAST({$monthSql} AS INTEGER) as month
                FROM activity
                WHERE {$yearSql} IN (:years)
                GROUP BY month
                ORDER BY month ASC
            SQL,
            [
                'years' => array_map(strval(...), $query->getYears()->toArray()),
            ],
            [
                'years' => ArrayParameterType::STRING,
            ]
        )->fetchFirstColumn());

        return new FindStreaksResponse(
            dayStreak: $this->findLongestStreakLengthInDays($days),
            weekStreak: $this->findLongestStreakLengthInWeeks($weeksAndYears),
            monthStreak: $this->findLongestStreakLengthInMonths($months),
        );
    }

    /**
     * @param int[] $numbers
     */
    private function findLongestStreakLengthInMonths(array $numbers): int
    {
        if (empty($numbers)) {
            return 0;
        }

        sort($numbers);

        $longestStreak = $currentStreak = 1;

        for ($i = 1; $i < count($numbers); ++$i) {
            if ($numbers[$i - 1] + 1 === $numbers[$i]) {
                ++$currentStreak;
                $longestStreak = max($longestStreak, $currentStreak);
            } else {
                $currentStreak = 1;
            }
        }

        return $longestStreak;
    }

    /**
     * @param string[] $days
     */
    private function findLongestStreakLengthInDays(array $days): int
    {
        sort($days);

        $longest = $current = 1;
        for ($i = 1; $i < count($days); ++$i) {
            $prev = SerializableDateTime::fromString($days[$i - 1]);
            $curr = SerializableDateTime::fromString($days[$i]);

            $diff = $prev->diff($curr)->days;
            if (1 === $diff) {
                ++$current;
                $longest = max($longest, $current);
            } else {
                $current = 1;
            }
        }

        return $longest;
    }

    /**
     * @param array<int, array{'year': int, 'week': int}> $weeksAndYears
     */
    private function findLongestStreakLengthInWeeks(array $weeksAndYears): int
    {
        $globalWeeks = [];

        foreach ($weeksAndYears as $row) {
            $year = (int) $row['year'];
            $week = (int) $row['week'];
            $globalWeeks[] = $year * 100 + $week;
        }

        // Remove duplicates and sort
        $globalWeeks = array_unique($globalWeeks);
        sort($globalWeeks);

        // Count the longest streak of consecutive weeks
        $longest = $current = 1;
        for ($i = 1; $i < count($globalWeeks); ++$i) {
            $prev = $globalWeeks[$i - 1];
            $curr = $globalWeeks[$i];

            // Check if it's the next week
            [$prevYear, $prevWeek] = [intdiv($prev, 100), $prev % 100];
            [$currYear, $currWeek] = [intdiv($curr, 100), $curr % 100];

            if (
                ($currYear === $prevYear && $currWeek === $prevWeek + 1)             // same year, next week
                || ($currYear === $prevYear + 1 && $prevWeek >= 52 && 0 === $currWeek)  // year rollover: week 52/53 to week 0
                || ($currYear === $prevYear + 1 && 53 === $prevWeek && 1 === $currWeek)    // alternative rollover handling
            ) {
                ++$current;
                $longest = max($longest, $current);
            } else {
                $current = 1;
            }
        }

        return $longest;
    }
}
