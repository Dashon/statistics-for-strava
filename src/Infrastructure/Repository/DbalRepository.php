<?php

declare(strict_types=1);

namespace App\Infrastructure\Repository;

use Doctrine\DBAL\Connection;

abstract readonly class DbalRepository
{
    public function __construct(
        protected Connection $connection,
    ) {
    }

    /**
     * Normalize database result keys to camelCase for PostgreSQL compatibility.
     * PostgreSQL stores unquoted column names in lowercase, so we need to convert them.
     *
     * @param array<string, mixed> $result
     * @return array<string, mixed>
     */
    protected function normalizeResultKeys(array $result): array
    {
        $normalized = [];
        foreach ($result as $key => $value) {
            // Convert lowercase keys to camelCase
            $normalizedKey = lcfirst(str_replace('_', '', ucwords($key, '_')));
            $normalized[$normalizedKey] = $value;
        }
        return $normalized;
    }
}
