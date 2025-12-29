<?php

declare(strict_types=1);

namespace App\Domain\Rewind\FindElevationPerMonth;

use App\Domain\Activity\SportType\SportType;
use App\Infrastructure\CQRS\Query\Query;
use App\Infrastructure\CQRS\Query\QueryHandler;
use App\Infrastructure\CQRS\Query\Response;
use App\Infrastructure\ValueObject\Measurement\Length\Meter;
use Doctrine\DBAL\ArrayParameterType;
use Doctrine\DBAL\Connection;

use App\Infrastructure\Repository\ProvidesDatabaseDateFormat;

final readonly class FindElevationPerMonthQueryHandler implements QueryHandler
{
    use ProvidesDatabaseDateFormat;

    public function __construct(
        private Connection $connection,
    ) {
    }

    public function handle(Query $query): Response
    {
        assert($query instanceof FindElevationPerMonth);

        $monthSql = $this->getDateFormatSql($this->connection, 'startDateTime', '%m');
        $yearSql = $this->getDateFormatSql($this->connection, 'startDateTime', '%Y');

        $totalElevation = (int) $this->connection->executeQuery(
            <<<SQL
                SELECT SUM(elevation) as distance
                FROM Activity
                WHERE {$yearSql} IN (:years)
            SQL,
            [
                'years' => array_map(strval(...), $query->getYears()->toArray()),
            ],
            [
                'years' => ArrayParameterType::STRING,
            ]
        )->fetchOne();

        $results = $this->connection->executeQuery(
            <<<SQL
                SELECT CAST({$monthSql} AS INTEGER) AS monthNumber, sportType, SUM(elevation) as elevation
                FROM Activity
                WHERE {$yearSql} IN (:years)
                GROUP BY sportType, monthNumber
                ORDER BY sportType ASC, monthNumber ASC
            SQL,
            [
                'years' => array_map(strval(...), $query->getYears()->toArray()),
            ],
            [
                'years' => ArrayParameterType::STRING,
            ]
        )->fetchAllAssociative();

        return new FindElevationPerMonthResponse(
            elevationPerMonth: array_map(
                fn(array $result): array => [
                    $result['monthNumber'],
                    SportType::from($result['sportType']),
                    Meter::from($result['elevation']),
                ],
                $results,
            ),
            totalElevation: Meter::from($totalElevation)
        );
    }
}
