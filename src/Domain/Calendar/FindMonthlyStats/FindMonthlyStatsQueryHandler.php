<?php

declare(strict_types=1);

namespace App\Domain\Calendar\FindMonthlyStats;

use App\Domain\Activity\ActivityType;
use App\Domain\Activity\ActivityTypes;
use App\Domain\Activity\SportType\SportType;
use App\Domain\Calendar\Month;
use App\Infrastructure\CQRS\Query\Query;
use App\Infrastructure\CQRS\Query\QueryHandler;
use App\Infrastructure\CQRS\Query\Response;
use App\Infrastructure\ValueObject\Measurement\Length\Meter;
use App\Infrastructure\ValueObject\Measurement\Time\Seconds;
use App\Infrastructure\ValueObject\Time\SerializableDateTime;
use Doctrine\DBAL\ArrayParameterType;
use Doctrine\DBAL\Connection;

use App\Infrastructure\Repository\ProvidesDatabaseDateFormat;

final readonly class FindMonthlyStatsQueryHandler implements QueryHandler
{
    use ProvidesDatabaseDateFormat;

    public function __construct(
        private Connection $connection,
    ) {
    }

    public function handle(Query $query): Response
    {
        assert($query instanceof FindMonthlyStats);

        $yearAndMonthSql = $this->getDateFormatSql($this->connection, 'startDateTime', '%Y-%m');

        $results = $this->connection->executeQuery(
            <<<SQL
                SELECT {$yearAndMonthSql} AS yearAndMonth,
                       sportType,
                       COUNT(*) AS numberOfActivities,
                       SUM(distance) AS totalDistance,
                       SUM(elevation) AS totalElevation,
                       SUM(movingTimeInSeconds) AS totalMovingTime,
                       SUM(calories) as totalCalories
                FROM Activity
                GROUP BY yearAndMonth, sportType
            SQL,
        )->fetchAllAssociative();

        $statsPerMonth = [];
        $activityTypes = ActivityTypes::empty();
        foreach ($results as $result) {
            $yearAndMonth = $result['yearAndMonth'] ?? $result['yearandmonth'];
            $month = Month::fromDate(SerializableDateTime::fromString(sprintf('%s-01 00:00:00', $yearAndMonth)));
            $sportType = SportType::from($result['sportType'] ?? $result['sporttype']);

            if (!$activityTypes->has($sportType->getActivityType())) {
                $activityTypes->add($sportType->getActivityType());
            }

            $statsPerMonth[] = [
                'month' => $month,
                'sportType' => $sportType,
                'numberOfActivities' => (int) ($result['numberOfActivities'] ?? $result['numberofactivities']),
                'distance' => Meter::from($result['totalDistance'] ?? $result['totaldistance'])->toKilometer(),
                'elevation' => Meter::from($result['totalElevation'] ?? $result['totalelevation']),
                'movingTime' => Seconds::from($result['totalMovingTime'] ?? $result['totalmovingtime']),
                'calories' => (int) ($result['totalCalories'] ?? $result['totalcalories']),
            ];
        }

        $minMaxDatePerActivityType = [];
        /** @var ActivityType $activityType */
        foreach ($activityTypes as $activityType) {
            /** @var non-empty-array<string, string> $result */
            $result = $this->connection->executeQuery(
                <<<SQL
                SELECT MIN(startDateTime) AS minStartDate,
                       MAX(startDateTime) AS maxStartDate
                FROM Activity
                WHERE sportType IN (:sportTypes)
                SQL,
                [
                    'sportTypes' => $activityType->getSportTypes()->map(fn(SportType $sportType) => $sportType->value),
                ],
                [
                    'sportTypes' => ArrayParameterType::STRING,
                ]
            )->fetchAssociative();

            $minMaxDatePerActivityType[] = [
                'activityType' => $activityType,
                'min' => Month::fromDate(SerializableDateTime::fromString($result['minStartDate'] ?? $result['minstartdate'])),
                'max' => Month::fromDate(SerializableDateTime::fromString($result['maxStartDate'] ?? $result['maxstartdate'])),
            ];
        }

        return new FindMonthlyStatsResponse(
            statsPerMonth: $statsPerMonth,
            minMaxMonthPerActivityType: $minMaxDatePerActivityType,
        );
    }
}
