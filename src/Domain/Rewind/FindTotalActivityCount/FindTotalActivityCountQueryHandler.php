<?php

declare(strict_types=1);

namespace App\Domain\Rewind\FindTotalActivityCount;

use App\Infrastructure\CQRS\Query\Query;
use App\Infrastructure\CQRS\Query\QueryHandler;
use App\Infrastructure\CQRS\Query\Response;
use Doctrine\DBAL\ArrayParameterType;
use Doctrine\DBAL\Connection;

use App\Infrastructure\Repository\ProvidesDatabaseDateFormat;

final readonly class FindTotalActivityCountQueryHandler implements QueryHandler
{
    use ProvidesDatabaseDateFormat;

    public function __construct(
        private Connection $connection,
    ) {
    }

    public function handle(Query $query): Response
    {
        assert($query instanceof FindTotalActivityCount);

        $yearSql = $this->getDateFormatSql($this->connection, 'startDateTime', '%Y');

        $activityCount = (int) $this->connection->executeQuery(
            <<<SQL
                SELECT COUNT(*)
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

        return new FindTotalActivityCountResponse($activityCount);
    }
}
