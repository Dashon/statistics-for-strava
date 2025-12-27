<?php

declare(strict_types=1);

namespace App\Infrastructure\Serialization;

final readonly class Escape
{
    public static function forJsonEncode(string $string): string
    {
        $string = str_replace(['"', '\''], '', $string);
        return htmlspecialchars($string, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    }
}
