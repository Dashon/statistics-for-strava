<?php

declare(strict_types=1);

namespace App\Domain\User;

use App\Infrastructure\ValueObject\Time\SerializableDateTime;

final readonly class User
{
    private function __construct(
        private UserId $id,
        private int $stravaAthleteId,
        private string $stravaAccessToken,
        private string $stravaRefreshToken,
        private SerializableDateTime $stravaTokenExpiresAt,
        private SerializableDateTime $createdAt,
        private SerializableDateTime $updatedAt,
        private array $roles,
    ) {
    }

    public static function create(
        int $stravaAthleteId,
        string $stravaAccessToken,
        string $stravaRefreshToken,
        SerializableDateTime $stravaTokenExpiresAt,
    ): self {
        return new self(
            id: UserId::random(),
            stravaAthleteId: $stravaAthleteId,
            stravaAccessToken: $stravaAccessToken,
            stravaRefreshToken: $stravaRefreshToken,
            stravaTokenExpiresAt: $stravaTokenExpiresAt,
            createdAt: SerializableDateTime::now(),
            updatedAt: SerializableDateTime::now(),
            roles: ['ROLE_USER'],
        );
    }

    public static function fromState(
        UserId $id,
        int $stravaAthleteId,
        string $stravaAccessToken,
        string $stravaRefreshToken,
        SerializableDateTime $stravaTokenExpiresAt,
        SerializableDateTime $createdAt,
        SerializableDateTime $updatedAt,
        array $roles,
    ): self {
        return new self(
            id: $id,
            stravaAthleteId: $stravaAthleteId,
            stravaAccessToken: $stravaAccessToken,
            stravaRefreshToken: $stravaRefreshToken,
            stravaTokenExpiresAt: $stravaTokenExpiresAt,
            createdAt: $createdAt,
            updatedAt: $updatedAt,
            roles: $roles,
        );
    }

    public function updateTokens(
        string $stravaAccessToken,
        string $stravaRefreshToken,
        SerializableDateTime $stravaTokenExpiresAt,
    ): self {
        return new self(
            id: $this->id,
            stravaAthleteId: $this->stravaAthleteId,
            stravaAccessToken: $stravaAccessToken,
            stravaRefreshToken: $stravaRefreshToken,
            stravaTokenExpiresAt: $stravaTokenExpiresAt,
            createdAt: $this->createdAt,
            updatedAt: SerializableDateTime::now(),
            roles: $this->roles,
        );
    }

    public function getId(): UserId
    {
        return $this->id;
    }

    public function getStravaAthleteId(): int
    {
        return $this->stravaAthleteId;
    }

    public function getStravaAccessToken(): string
    {
        return $this->stravaAccessToken;
    }

    public function getStravaRefreshToken(): string
    {
        return $this->stravaRefreshToken;
    }

    public function getStravaTokenExpiresAt(): SerializableDateTime
    {
        return $this->stravaTokenExpiresAt;
    }

    public function getCreatedAt(): SerializableDateTime
    {
        return $this->createdAt;
    }

    public function getUpdatedAt(): SerializableDateTime
    {
        return $this->updatedAt;
    }

    public function getRoles(): array
    {
        return $this->roles;
    }

    public function isTokenExpired(): bool
    {
        return $this->stravaTokenExpiresAt->isBeforeNow();
    }
}
