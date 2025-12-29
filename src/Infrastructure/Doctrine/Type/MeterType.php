<?php

declare(strict_types=1);

namespace App\Infrastructure\Doctrine\Type;

use App\Infrastructure\ValueObject\Measurement\Length\Meter;
use Doctrine\DBAL\Platforms\AbstractPlatform;
use Doctrine\DBAL\Types\Type;

final class MeterType extends Type
{
    public const NAME = 'meter';

    public function getSQLDeclaration(array $column, AbstractPlatform $platform): string
    {
        return $platform->getFloatDeclarationSQL($column);
    }

    public function convertToPHPValue($value, AbstractPlatform $platform): ?Meter
    {
        if (null === $value) {
            return null;
        }

        return Meter::from((float) $value);
    }

    public function convertToDatabaseValue($value, AbstractPlatform $platform): ?float
    {
        if ($value instanceof Meter) {
            return $value->toFloat();
        }

        return null;
    }

    public function getName(): string
    {
        return self::NAME;
    }
}
