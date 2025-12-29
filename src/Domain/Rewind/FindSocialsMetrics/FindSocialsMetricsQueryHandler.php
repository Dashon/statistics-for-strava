<?php

declare(strict_types=1);

namespace App\Domain\Rewind\FindSocialsMetrics;

use App\Infrastructure\CQRS\Query\Query;
use App\Infrastructure\CQRS\Query\QueryHandler;
use App\Infrastructure\CQRS\Query\Response;
use Doctrine\DBAL\ArrayParameterType;
use Doctrine\DBAL\Connection;

use App\Infrastructure\Repository\ProvidesDatabaseDateFormat;

final readonly class FindSocialsMetricsQueryHandler implements QueryHandler
{
    use ProvidesDatabaseDateFormat;

    public function __construct(
        private Connection $connection,
    ) {
    }

    public function handle(Query $query): Response
    {
        assert($query instanceof FindSocialsMetrics);

        $yearSql = $this->getDateFormatSql($this->connection, 'startDateTime', '%Y');

        /** @var array<string,mixed> $result */
        $result = $this->connection->executeQuery(
            <<<SQL
                SELECT SUM(kudoCount) as kudoCount, SUM(JSON_EXTRACT(data, '$.comment_count')) as commentCount
                FROM Activity
                WHERE {$yearSql} IN (:years)
            SQL,
            [
                'years' => array_map(strval(...), $query->getYears()->toArray()),
            ],
            [
                'years' => ArrayParameterType::STRING,
            ]
        )->fetchAssociative();

        return new FindSocialsMetricsResponse(
            kudoCount: (int) $result['kudoCount'],
            commentCount: (int) $result['commentCount'],
        );
    }
}
