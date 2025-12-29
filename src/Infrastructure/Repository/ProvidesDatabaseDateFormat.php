<?php

declare(strict_types=1);

namespace App\Infrastructure\Repository;

use Doctrine\DBAL\Connection;
use Doctrine\DBAL\Platforms\PostgreSQLPlatform;

trait ProvidesDatabaseDateFormat
{
    protected function getDateFormatSql(Connection $connection, string $column, string $format): string
    {
        $isPostgres = $connection->getDatabasePlatform() instanceof PostgreSQLPlatform;

        if (!$isPostgres) {
            return sprintf("strftime('%s', %s)", $format, $column);
        }

        // Map SQLite strftime formats to PostgreSQL
        $formatMap = [
            '%Y' => "to_char(%s, 'YYYY')",
            '%m' => "to_char(%s, 'MM')",
            '%d' => "to_char(%s, 'DD')",
            '%H' => "to_char(%s, 'HH24')",
            '%M' => "to_char(%s, 'MI')",
            '%S' => "to_char(%s, 'SS')",
            '%Y-%m-%d' => "to_char(%s, 'YYYY-MM-DD')",
            '%Y-%m' => "to_char(%s, 'YYYY-MM')",
            '%W' => "to_char(%s, 'IW')", // ISO Week
            '%w' => "CAST(EXTRACT(DOW FROM %s) AS TEXT)", // 0-6, Sunday=0 (Matches SQLite)
        ];

        if (!isset($formatMap[$format])) {
            return sprintf("to_char(%s, '%s')", $column, $format);
        }

        return sprintf($formatMap[$format], $column);
    }
}
