<?php

declare(strict_types=1);

namespace App\Infrastructure\Doctrine\Type;

use App\Infrastructure\ValueObject\Measurement\Length\Kilometer;
use Doctrine\DBAL\Platforms\AbstractPlatform;
use Doctrine\DBAL\Types\Type;

final class KilometerType extends Type
{
    public const NAME = 'kilometer';

    public function getSQLDeclaration(array $column, AbstractPlatform $platform): string
    {
        return $platform->getFloatDeclarationSQL($column);
    }

    public function convertToPHPValue($value, AbstractPlatform $platform): ?Kilometer
    {
        if (null === $value) {
            return null;
        }

        return Kilometer::from((float) $value);
    }

    public function convertToDatabaseValue($value, AbstractPlatform $platform): ?float
    {
        if ($value instanceof Kilometer) {
            return $value->toFloat();
        }

        return null;
    }

    public function getName(): string
    {
        return self::NAME;
    }
}
