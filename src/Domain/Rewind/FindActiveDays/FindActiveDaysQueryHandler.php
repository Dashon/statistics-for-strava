<?php

declare(strict_types=1);

namespace App\Domain\Rewind\FindActiveDays;

use App\Infrastructure\CQRS\Query\Query;
use App\Infrastructure\CQRS\Query\QueryHandler;
use App\Infrastructure\CQRS\Query\Response;
use Doctrine\DBAL\ArrayParameterType;
use Doctrine\DBAL\Connection;

use App\Infrastructure\Repository\ProvidesDatabaseDateFormat;

final readonly class FindActiveDaysQueryHandler implements QueryHandler
{
    use ProvidesDatabaseDateFormat;

    public function __construct(
        private Connection $connection,
    ) {
    }

    public function handle(Query $query): Response
    {
        assert($query instanceof FindActiveDays);

        $dateSql = $this->getDateFormatSql($this->connection, 'startDateTime', '%Y-%m-%d');
        $yearSql = $this->getDateFormatSql($this->connection, 'startDateTime', '%Y');

        $numberOfActiveDays = (int) $this->connection->executeQuery(
            <<<SQL
                SELECT COUNT(*)
                FROM (
                SELECT {$dateSql} AS date
                      FROM Activity
                      WHERE {$yearSql} IN (:years)
                      GROUP BY date
                  )
            SQL,
            [
                'years' => array_map(strval(...), $query->getYears()->toArray()),
            ],
            [
                'years' => ArrayParameterType::STRING,
            ]
        )->fetchOne();

        return new FindActiveDaysResponse($numberOfActiveDays);
    }
}
