<?php

declare(strict_types=1);

namespace App\Domain\Dashboard\Widget\TrainingLoad\FindNumberOfRestDays;

use App\Infrastructure\CQRS\Query\Query;
use App\Infrastructure\CQRS\Query\QueryHandler;
use App\Infrastructure\CQRS\Query\Response;
use Doctrine\DBAL\Connection;

use App\Infrastructure\Repository\ProvidesDatabaseDateFormat;

final readonly class FindNumberOfRestDaysQueryHandler implements QueryHandler
{
    use ProvidesDatabaseDateFormat;

    public function __construct(
        private Connection $connection,
    ) {
    }

    public function handle(Query $query): Response
    {
        assert($query instanceof FindNumberOfRestDays);

        $dateSql = $this->getDateFormatSql($this->connection, 'startDateTime', '%Y-%m-%d');

        $numberOfActiveDays = (int) $this->connection->executeQuery(
            <<<SQL
                SELECT COUNT(*)
                FROM (
                SELECT {$dateSql} AS date
                      FROM Activity
                      WHERE {$dateSql} BETWEEN :startDate AND :endDate
                      GROUP BY date
               )
            SQL,
            [
                'startDate' => (string) $query->getDateRange()->getFrom()->format('Y-m-d'),
                'endDate' => (string) $query->getDateRange()->getTill()->format('Y-m-d'),
            ]
        )->fetchOne();

        return new FindNumberOfRestDaysResponse($query->getDateRange()->getNumberOfDays() - $numberOfActiveDays);
    }
}
