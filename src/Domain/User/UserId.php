<?php

declare(strict_types=1);

namespace App\Domain\User;

use App\Infrastructure\ValueObject\Identifier;
use Ramsey\Uuid\Uuid;

final readonly class UserId
{
    use Identifier;

    private function __construct(
        private string $userId
    ) {
    }

    public static function fromString(string $userId): self
    {
        return new self($userId);
    }

    public static function random(): self
    {
        return new self(Uuid::uuid4()->toString());
    }

    public function __toString(): string
    {
        return $this->userId;
    }
}
