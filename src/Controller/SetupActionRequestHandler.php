<?php

declare(strict_types=1);

namespace App\Controller;

use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Component\HttpKernel\KernelInterface;
use Symfony\Component\Process\Process;
use Symfony\Component\Routing\Attribute\Route;

#[AsController]
final readonly class SetupActionRequestHandler
{
    public function __construct(
        private KernelInterface $kernel,
    ) {
    }

    #[Route(path: '/api/setup/clear-cache', methods: ['POST'])]
    public function clearCache(): JsonResponse
    {
        try {
            $cacheDir = $this->kernel->getProjectDir() . '/var/cache';

            // Get all cache directories
            if (is_dir($cacheDir)) {
                $dirs = array_diff(scandir($cacheDir), ['.', '..', '.gitkeep']);
                foreach ($dirs as $dir) {
                    $fullPath = $cacheDir . '/' . $dir;
                    if (is_dir($fullPath)) {
                        $this->removeDirectory($fullPath);
                    }
                }
            }

            return new JsonResponse([
                'success' => true,
                'message' => 'Cache cleared successfully. Please refresh the page.',
            ], Response::HTTP_OK);
        } catch (\Throwable $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Failed to clear cache: ' . $e->getMessage(),
                'error' => $e->getMessage(),
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    private function removeDirectory(string $dir): void
    {
        if (!is_dir($dir)) {
            return;
        }

        $files = array_diff(scandir($dir), ['.', '..']);
        foreach ($files as $file) {
            $path = $dir . '/' . $file;
            is_dir($path) ? $this->removeDirectory($path) : unlink($path);
        }
        rmdir($dir);
    }

    #[Route(path: '/api/setup/import', methods: ['POST'])]
    public function importData(): JsonResponse
    {
        try {
            $process = new Process(
                command: ['php', 'bin/console', 'app:strava:import-data'],
                cwd: $this->kernel->getProjectDir(),
                timeout: 600
            );

            $process->run();

            if ($process->isSuccessful()) {
                return new JsonResponse([
                    'success' => true,
                    'message' => 'Data import completed successfully',
                    'output' => $process->getOutput(),
                ], Response::HTTP_OK);
            }

            return new JsonResponse([
                'success' => false,
                'message' => 'Import failed',
                'output' => $process->getErrorOutput(),
                'error' => $process->getErrorOutput(),
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        } catch (\Throwable $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Import failed: ' . $e->getMessage(),
                'error' => $e->getMessage(),
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    #[Route(path: '/api/setup/build', methods: ['POST'])]
    public function buildFiles(): JsonResponse
    {
        try {
            $process = new Process(
                command: ['php', 'bin/console', 'app:strava:build-files'],
                cwd: $this->kernel->getProjectDir(),
                timeout: 600
            );

            $process->run();

            if ($process->isSuccessful()) {
                return new JsonResponse([
                    'success' => true,
                    'message' => 'Build completed successfully',
                    'output' => $process->getOutput(),
                ], Response::HTTP_OK);
            }

            return new JsonResponse([
                'success' => false,
                'message' => 'Build failed',
                'output' => $process->getErrorOutput(),
                'error' => $process->getErrorOutput(),
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        } catch (\Throwable $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Build failed: ' . $e->getMessage(),
                'error' => $e->getMessage(),
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
