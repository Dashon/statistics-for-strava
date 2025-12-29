<?php

declare(strict_types=1);

namespace App\Domain\Activity\Grid\FindCaloriesBurnedPerDay;

use App\Infrastructure\CQRS\Query\Query;
use App\Infrastructure\CQRS\Query\QueryHandler;
use App\Infrastructure\CQRS\Query\Response;
use Doctrine\DBAL\ArrayParameterType;
use Doctrine\DBAL\Connection;

use App\Infrastructure\Repository\ProvidesDatabaseDateFormat;

final readonly class FindCaloriesBurnedPerDayQueryHandler implements QueryHandler
{
    use ProvidesDatabaseDateFormat;

    public function __construct(
        private Connection $connection,
    ) {
    }

    public function handle(Query $query): Response
    {
        assert($query instanceof FindCaloriesBurnedPerDay);

        $dateSql = $this->getDateFormatSql($this->connection, 'startDateTime', '%Y-%m-%d');
        $yearSql = $this->getDateFormatSql($this->connection, 'startDateTime', '%Y');

        return new FindCaloriesBurnedPerDayResponse($this->connection->executeQuery(
            <<<SQL
                SELECT
                    {$dateSql} AS date,
                    SUM(calories) AS caloriesBurned
                FROM Activity
                WHERE {$yearSql} IN (:years)
                GROUP BY date
                ORDER BY date DESC
            SQL,
            [
                'years' => array_map(strval(...), $query->getYears()->toArray()),
            ],
            [
                'years' => ArrayParameterType::STRING,
            ]
        )->fetchAllKeyValue());
    }
}
