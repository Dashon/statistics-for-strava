<?php

namespace App\Domain\Letter;

use App\Domain\Activity\ActivityId;
use Doctrine\DBAL\Connection;

final readonly class DbalRunLetterRepository implements RunLetterRepository
{
    public function __construct(
        private Connection $connection,
    ) {
    }

    public function save(RunLetter $letter): void
    {
        $sql = 'REPLACE INTO run_letters (
            activity_id,
            letter_text,
            edited_text,
            generated_at,
            edited_at,
            share_token,
            is_public
        ) VALUES (?, ?, ?, ?, ?, ?, ?)';

        $this->connection->executeStatement($sql, [
            (string) $letter->getActivityId(),
            $letter->getOriginalLetterText(),
            $letter->getEditedText(),
            $letter->getGeneratedAt()->getTimestamp(),
            $letter->getEditedAt()?->getTimestamp(),
            $letter->getShareToken(),
            $letter->isPublic() ? 1 : 0,
        ]);
    }

    public function find(ActivityId $activityId): ?RunLetter
    {
        $result = $this->connection->executeQuery(
            'SELECT * FROM run_letters WHERE activity_id = ?',
            [(string) $activityId]
        )->fetchAssociative();

        if (!$result) {
            return null;
        }

        return $this->hydrate($result);
    }

    public function findByShareToken(string $token): ?RunLetter
    {
        $result = $this->connection->executeQuery(
            'SELECT * FROM run_letters WHERE share_token = ? AND is_public = 1',
            [$token]
        )->fetchAssociative();

        if (!$result) {
            return null;
        }

        return $this->hydrate($result);
    }

    public function findAll(): array
    {
        $results = $this->connection->executeQuery(
            'SELECT * FROM run_letters ORDER BY generated_at DESC'
        )->fetchAllAssociative();

        return array_map(fn ($row) => $this->hydrate($row), $results);
    }

    public function hasLetter(ActivityId $activityId): bool
    {
        return (bool) $this->connection->executeQuery(
            'SELECT 1 FROM run_letters WHERE activity_id = ?',
            [(string) $activityId]
        )->fetchOne();
    }

    private function hydrate(array $row): RunLetter
    {
        // Use reflection to create the entity since constructor is private
        $reflection = new \ReflectionClass(RunLetter::class);
        $instance = $reflection->newInstanceWithoutConstructor();

        $activityIdProp = $reflection->getProperty('activityId');
        $activityIdProp->setValue($instance, $row['activity_id']);

        $letterTextProp = $reflection->getProperty('letterText');
        $letterTextProp->setValue($instance, $row['letter_text']);

        $editedTextProp = $reflection->getProperty('editedText');
        $editedTextProp->setValue($instance, $row['edited_text']);

        $generatedAtProp = $reflection->getProperty('generatedAt');
        $generatedAtProp->setValue($instance, (int) $row['generated_at']);

        $editedAtProp = $reflection->getProperty('editedAt');
        $editedAtProp->setValue($instance, $row['edited_at'] ? (int) $row['edited_at'] : null);

        $shareTokenProp = $reflection->getProperty('shareToken');
        $shareTokenProp->setValue($instance, $row['share_token']);

        $isPublicProp = $reflection->getProperty('isPublic');
        $isPublicProp->setValue($instance, (int) $row['is_public']);

        return $instance;
    }
}
