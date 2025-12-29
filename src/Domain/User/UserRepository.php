<?php

declare(strict_types=1);

namespace App\Domain\User;

interface UserRepository
{
    public function find(UserId $userId): User;

    public function findByStravaAthleteId(int $stravaAthleteId): ?User;

    public function save(User $user): void;

    public function update(User $user): void;

    public function exists(UserId $userId): bool;

    public function existsByStravaAthleteId(int $stravaAthleteId): bool;
}
