<?php

declare(strict_types=1);

namespace App\Domain\Rewind\FindActivityCountPerMonth;

use App\Domain\Activity\SportType\SportType;
use App\Infrastructure\CQRS\Query\Query;
use App\Infrastructure\CQRS\Query\QueryHandler;
use App\Infrastructure\CQRS\Query\Response;
use Doctrine\DBAL\ArrayParameterType;
use Doctrine\DBAL\Connection;

use App\Infrastructure\Repository\ProvidesDatabaseDateFormat;

final readonly class FindActivityCountPerMonthQueryHandler implements QueryHandler
{
    use ProvidesDatabaseDateFormat;

    public function __construct(
        private Connection $connection,
    ) {
    }

    public function handle(Query $query): Response
    {
        assert($query instanceof FindActivityCountPerMonth);

        $monthSql = $this->getDateFormatSql($this->connection, 'startDateTime', '%m');
        $yearSql = $this->getDateFormatSql($this->connection, 'startDateTime', '%Y');

        $results = $this->connection->executeQuery(
            <<<SQL
                SELECT CAST({$monthSql} AS INTEGER) AS monthNumber, sportType, COUNT(1) as count
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

        return new FindActivityCountPerMonthResponse(
            array_map(
                fn(array $result): array => [
                    $result['monthNumber'],
                    SportType::from($result['sportType']),
                    $result['count'],
                ],
                $results,
            )
        );
    }
}
