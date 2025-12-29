<?php

declare(strict_types=1);

namespace App\Domain\Dashboard\Widget\YearlyStats\FindYearlyStats;

use App\Domain\Activity\ActivityType;
use App\Infrastructure\CQRS\Query\Query;
use App\Infrastructure\CQRS\Query\QueryHandler;
use App\Infrastructure\CQRS\Query\Response;
use App\Infrastructure\ValueObject\Measurement\Length\Meter;
use App\Infrastructure\ValueObject\Measurement\Time\Seconds;
use App\Infrastructure\ValueObject\Time\Year;
use Doctrine\DBAL\Connection;

use App\Infrastructure\Repository\ProvidesDatabaseDateFormat;

final readonly class FindYearlyStatsQueryHandler implements QueryHandler
{
    use ProvidesDatabaseDateFormat;

    public function __construct(
        private Connection $connection,
    ) {
    }

    public function handle(Query $query): Response
    {
        assert($query instanceof FindYearlyStats);

        $yearSql = $this->getDateFormatSql($this->connection, 'startDateTime', '%Y');

        $results = $this->connection->executeQuery(
            <<<SQL
                SELECT {$yearSql} AS year,
                       activityType,
                       COUNT(*) AS numberOfActivities,
                       SUM(distance) AS totalDistance,
                       SUM(elevation) AS totalElevation,
                       SUM(movingTimeInSeconds) AS totalMovingTime,
                       SUM(calories) as totalCalories
                FROM Activity
                GROUP BY year, activityType
            SQL,
        )->fetchAllAssociative();

        $statsPerYear = [];

        foreach ($results as $result) {
            $statsPerYear[] = [
                'year' => Year::fromInt((int) ($result['year'] ?? $result['year'])), // Postgres year is already lowercase if unquoted
                'activityType' => ActivityType::from($result['activityType'] ?? $result['activitytype']),
                'numberOfActivities' => (int) ($result['numberOfActivities'] ?? $result['numberofactivities']),
                'distance' => Meter::from($result['totalDistance'] ?? $result['totaldistance'])->toKilometer(),
                'elevation' => Meter::from($result['totalElevation'] ?? $result['totalelevation']),
                'movingTime' => Seconds::from($result['totalMovingTime'] ?? $result['totalmovingtime']),
                'calories' => (int) ($result['totalCalories'] ?? $result['totalcalories']),
            ];
        }

        return new FindYearlyStatsResponse($statsPerYear);
    }
}
