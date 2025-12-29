<?php

require_once __DIR__ . '/vendor/autoload.php';

use App\Infrastructure\Config\AppConfig;
use App\Infrastructure\ValueObject\String\KernelProjectDir;
use App\Infrastructure\ValueObject\String\PlatformEnvironment;

$kernelProjectDir = KernelProjectDir::fromString(__DIR__);
$platformEnvironment = PlatformEnvironment::PROD;

AppConfig::init($kernelProjectDir, $platformEnvironment);

try {
    $ftpHistory = AppConfig::get('general.athlete.ftpHistory');
    echo "Config found: " . json_encode($ftpHistory) . "\n";
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    // Dump all config keys to see what's loaded
    print_r(AppConfig::getRoot());
}
