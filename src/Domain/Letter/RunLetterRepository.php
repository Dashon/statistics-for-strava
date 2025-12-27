<?php

namespace App\Domain\Letter;

use App\Domain\Activity\ActivityId;

interface RunLetterRepository
{
    public function save(RunLetter $letter): void;

    public function find(ActivityId $activityId): ?RunLetter;

    public function findByShareToken(string $token): ?RunLetter;

    public function findAll(): array;

    public function hasLetter(ActivityId $activityId): bool;
}
