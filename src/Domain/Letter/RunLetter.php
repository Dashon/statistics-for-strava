<?php

namespace App\Domain\Letter;

use App\Domain\Activity\ActivityId;
use App\Infrastructure\ValueObject\Time\SerializableDateTime;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: 'run_letters')]
final readonly class RunLetter
{
    private function __construct(
        #[ORM\Id]
        #[ORM\Column(type: 'string', name: 'activity_id')]
        private string $activityId,
        #[ORM\Column(type: 'text', name: 'letter_text')]
        private string $letterText,
        #[ORM\Column(type: 'text', name: 'edited_text', nullable: true)]
        private ?string $editedText,
        #[ORM\Column(type: 'integer', name: 'generated_at')]
        private int $generatedAt,
        #[ORM\Column(type: 'integer', name: 'edited_at', nullable: true)]
        private ?int $editedAt,
        #[ORM\Column(type: 'string', name: 'share_token', unique: true, nullable: true)]
        private ?string $shareToken,
        #[ORM\Column(type: 'integer', name: 'is_public')]
        private int $isPublic,
    ) {
    }

    public static function create(
        ActivityId $activityId,
        string $letterText,
        SerializableDateTime $generatedAt,
    ): self {
        return new self(
            activityId: (string) $activityId,
            letterText: $letterText,
            editedText: null,
            generatedAt: $generatedAt->getTimestamp(),
            editedAt: null,
            shareToken: self::generateShareToken(),
            isPublic: 0,
        );
    }

    public function edit(string $newText, SerializableDateTime $editedAt): self
    {
        return new self(
            activityId: $this->activityId,
            letterText: $this->letterText,
            editedText: $newText,
            generatedAt: $this->generatedAt,
            editedAt: $editedAt->getTimestamp(),
            shareToken: $this->shareToken,
            isPublic: $this->isPublic,
        );
    }

    public function makePublic(): self
    {
        return new self(
            activityId: $this->activityId,
            letterText: $this->letterText,
            editedText: $this->editedText,
            generatedAt: $this->generatedAt,
            editedAt: $this->editedAt,
            shareToken: $this->shareToken ?? self::generateShareToken(),
            isPublic: 1,
        );
    }

    public function makePrivate(): self
    {
        return new self(
            activityId: $this->activityId,
            letterText: $this->letterText,
            editedText: $this->editedText,
            generatedAt: $this->generatedAt,
            editedAt: $this->editedAt,
            shareToken: $this->shareToken,
            isPublic: 0,
        );
    }

    public function getActivityId(): ActivityId
    {
        return ActivityId::fromString($this->activityId);
    }

    public function getLetterText(): string
    {
        return $this->editedText ?? $this->letterText;
    }

    public function getOriginalLetterText(): string
    {
        return $this->letterText;
    }

    public function getEditedText(): ?string
    {
        return $this->editedText;
    }

    public function wasEdited(): bool
    {
        return null !== $this->editedText;
    }

    public function getGeneratedAt(): SerializableDateTime
    {
        return SerializableDateTime::fromTimestamp($this->generatedAt);
    }

    public function getEditedAt(): ?SerializableDateTime
    {
        return $this->editedAt ? SerializableDateTime::fromTimestamp($this->editedAt) : null;
    }

    public function getShareToken(): ?string
    {
        return $this->shareToken;
    }

    public function isPublic(): bool
    {
        return 1 === $this->isPublic;
    }

    private static function generateShareToken(): string
    {
        return bin2hex(random_bytes(16));
    }
}
