<?php

declare(strict_types=1);

namespace App\Infrastructure\Repository;

use App\Domain\User\User;
use App\Domain\User\UserId;
use App\Domain\User\UserRepository;
use App\Infrastructure\Exception\EntityNotFound;
use App\Infrastructure\ValueObject\Time\SerializableDateTime;
use Doctrine\DBAL\Connection;

final readonly class DbalUserRepository implements UserRepository
{
    public function __construct(
        private Connection $connection,
    ) {
    }

    public function find(UserId $userId): User
    {
        $queryBuilder = $this->connection->createQueryBuilder();
        $queryBuilder->select('*')
            ->from('User')
            ->andWhere('userId = :userId')
            ->setParameter('userId', (string) $userId);

        if (!$result = $queryBuilder->executeQuery()->fetchAssociative()) {
            throw new EntityNotFound(sprintf('User "%s" not found', $userId));
        }

        return $this->hydrate($result);
    }

    public function findByStravaAthleteId(int $stravaAthleteId): ?User
    {
        $queryBuilder = $this->connection->createQueryBuilder();
        $queryBuilder->select('*')
            ->from('User')
            ->andWhere('stravaAthleteId = :stravaAthleteId')
            ->setParameter('stravaAthleteId', $stravaAthleteId);

        if (!$result = $queryBuilder->executeQuery()->fetchAssociative()) {
            return null;
        }

        return $this->hydrate($result);
    }

    public function save(User $user): void
    {
        $sql = 'INSERT INTO User (
            userId, stravaAthleteId, stravaAccessToken, stravaRefreshToken,
            stravaTokenExpiresAt, createdAt, updatedAt, roles
        ) VALUES (
            :userId, :stravaAthleteId, :stravaAccessToken, :stravaRefreshToken,
            :stravaTokenExpiresAt, :createdAt, :updatedAt, :roles
        )';

        $this->connection->executeStatement($sql, [
            'userId' => (string) $user->getId(),
            'stravaAthleteId' => $user->getStravaAthleteId(),
            'stravaAccessToken' => $user->getStravaAccessToken(),
            'stravaRefreshToken' => $user->getStravaRefreshToken(),
            'stravaTokenExpiresAt' => $user->getStravaTokenExpiresAt()->format('Y-m-d H:i:s'),
            'createdAt' => $user->getCreatedAt()->format('Y-m-d H:i:s'),
            'updatedAt' => $user->getUpdatedAt()->format('Y-m-d H:i:s'),
            'roles' => json_encode($user->getRoles()),
        ]);
    }

    public function update(User $user): void
    {
        $sql = 'UPDATE User SET
            stravaAccessToken = :stravaAccessToken,
            stravaRefreshToken = :stravaRefreshToken,
            stravaTokenExpiresAt = :stravaTokenExpiresAt,
            updatedAt = :updatedAt
            WHERE userId = :userId';

        $this->connection->executeStatement($sql, [
            'userId' => (string) $user->getId(),
            'stravaAccessToken' => $user->getStravaAccessToken(),
            'stravaRefreshToken' => $user->getStravaRefreshToken(),
            'stravaTokenExpiresAt' => $user->getStravaTokenExpiresAt()->format('Y-m-d H:i:s'),
            'updatedAt' => $user->getUpdatedAt()->format('Y-m-d H:i:s'),
        ]);
    }

    public function exists(UserId $userId): bool
    {
        return !empty($this->connection->executeQuery(
            'SELECT 1 FROM User WHERE userId = :userId',
            ['userId' => (string) $userId]
        )->fetchOne());
    }

    public function existsByStravaAthleteId(int $stravaAthleteId): bool
    {
        return !empty($this->connection->executeQuery(
            'SELECT 1 FROM User WHERE stravaAthleteId = :stravaAthleteId',
            ['stravaAthleteId' => $stravaAthleteId]
        )->fetchOne());
    }

    /**
     * @param array<string, mixed> $result
     */
    private function hydrate(array $result): User
    {
        return User::fromState(
            id: UserId::fromString($result['userId'] ?? $result['userid']),
            stravaAthleteId: (int) ($result['stravaAthleteId'] ?? $result['stravaathleteid']),
            stravaAccessToken: $result['stravaAccessToken'] ?? $result['stravaaccesstoken'],
            stravaRefreshToken: $result['stravaRefreshToken'] ?? $result['stravarefreshtoken'],
            stravaTokenExpiresAt: SerializableDateTime::fromString($result['stravaTokenExpiresAt'] ?? $result['stravatokenexpiresat']),
            createdAt: SerializableDateTime::fromString($result['createdAt'] ?? $result['createdat']),
            updatedAt: SerializableDateTime::fromString($result['updatedAt'] ?? $result['updatedat']),
            roles: json_decode($result['roles'], true),
        );
    }
}
