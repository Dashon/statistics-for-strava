<?php

declare(strict_types=1);

namespace App\Domain\Rewind\FindActivityStartTimesPerHour;

use App\Infrastructure\CQRS\Query\Query;
use App\Infrastructure\CQRS\Query\QueryHandler;
use App\Infrastructure\CQRS\Query\Response;
use Doctrine\DBAL\ArrayParameterType;
use Doctrine\DBAL\Connection;

use App\Infrastructure\Repository\ProvidesDatabaseDateFormat;

final readonly class FindActivityStartTimesPerHourQueryHandler implements QueryHandler
{
    use ProvidesDatabaseDateFormat;

    public function __construct(
        private Connection $connection,
    ) {
    }

    public function handle(Query $query): Response
    {
        assert($query instanceof FindActivityStartTimesPerHour);

        $hourSql = $this->getDateFormatSql($this->connection, 'startDateTime', '%H');
        $yearSql = $this->getDateFormatSql($this->connection, 'startDateTime', '%Y');

        /** @var array<int, int> $results */
        $results = $this->connection->executeQuery(
            <<<SQL
                SELECT CAST(LTRIM({$hourSql}, '0') as INTEGER) as hour, COUNT(*) as count
                FROM Activity
                WHERE {$yearSql} IN (:years)
                GROUP BY hour
                ORDER BY hour ASC
            SQL,
            [
                'years' => array_map(strval(...), $query->getYears()->toArray()),
            ],
            [
                'years' => ArrayParameterType::STRING,
            ]
        )->fetchAllKeyValue();

        return new FindActivityStartTimesPerHourResponse($results);
    }
}
