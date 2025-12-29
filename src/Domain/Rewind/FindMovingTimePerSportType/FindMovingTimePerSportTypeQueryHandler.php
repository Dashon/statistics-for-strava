<?php

declare(strict_types=1);

namespace App\Domain\Rewind\FindMovingTimePerSportType;

use App\Infrastructure\CQRS\Query\Query;
use App\Infrastructure\CQRS\Query\QueryHandler;
use App\Infrastructure\CQRS\Query\Response;
use Doctrine\DBAL\ArrayParameterType;
use Doctrine\DBAL\Connection;

use App\Infrastructure\Repository\ProvidesDatabaseDateFormat;

final readonly class FindMovingTimePerSportTypeQueryHandler implements QueryHandler
{
    use ProvidesDatabaseDateFormat;

    public function __construct(
        private Connection $connection,
    ) {
    }

    public function handle(Query $query): Response
    {
        assert($query instanceof FindMovingTimePerSportType);

        $yearSql = $this->getDateFormatSql($this->connection, 'startDateTime', '%Y');

        $totalMovingTime = (int) $this->connection->executeQuery(
            <<<SQL
                SELECT SUM(movingTimeInSeconds) as movingTimeInSeconds
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

        return new FindMovingTimePerSportTypeResponse(
            movingTimePerSportType: $this->connection->executeQuery(
                <<<SQL
                SELECT sportType, SUM(movingTimeInSeconds) as movingTimeInSeconds
                FROM Activity
                WHERE {$yearSql} IN (:years)
                GROUP BY sportType
                ORDER BY sportType ASC
                SQL,
                [
                    'years' => array_map(strval(...), $query->getYears()->toArray()),
                ],
                [
                    'years' => ArrayParameterType::STRING,
                ]
            )->fetchAllKeyValue(),
            totalMovingTime: $totalMovingTime
        );
    }
}
