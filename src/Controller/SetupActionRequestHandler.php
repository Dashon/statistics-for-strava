<?php

declare(strict_types=1);

namespace App\Controller;

use App\Application\RunBuild\RunBuild;
use App\Application\RunImport\RunImport;
use App\Infrastructure\CQRS\Command\Bus\CommandBus;
use App\Infrastructure\Doctrine\Migrations\MigrationRunner;
use App\Infrastructure\Logging\LoggableConsoleOutput;
use Psr\Log\LoggerInterface;
use Symfony\Component\Console\Input\ArrayInput;
use Symfony\Component\Console\Output\BufferedOutput;
use Symfony\Component\Console\Style\SymfonyStyle;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Component\Routing\Attribute\Route;

#[AsController]
final readonly class SetupActionRequestHandler
{
    public function __construct(
        private CommandBus $commandBus,
        private MigrationRunner $migrationRunner,
        private LoggerInterface $logger,
    ) {
    }

    #[Route(path: '/api/setup/clear-cache', methods: ['POST'])]
    public function clearCache(): JsonResponse
    {
        try {
            $cacheDir = __DIR__ . '/../../var/cache';

            // Remove cache directories
            $this->removeDirectory($cacheDir . '/prod');
            $this->removeDirectory($cacheDir . '/dev');

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
            $bufferedOutput = new BufferedOutput();
            $output = new SymfonyStyle(
                input: new ArrayInput([]),
                output: new LoggableConsoleOutput($bufferedOutput, $this->logger)
            );

            $this->migrationRunner->run($output);

            $this->commandBus->dispatch(new RunImport(
                output: $output,
                restrictToActivityIds: null,
            ));

            return new JsonResponse([
                'success' => true,
                'message' => 'Data import completed successfully',
                'output' => $bufferedOutput->fetch(),
            ], Response::HTTP_OK);
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
            $bufferedOutput = new BufferedOutput();
            $output = new SymfonyStyle(
                input: new ArrayInput([]),
                output: new LoggableConsoleOutput($bufferedOutput, $this->logger)
            );

            $this->commandBus->dispatch(new RunBuild(
                output: $output,
            ));

            return new JsonResponse([
                'success' => true,
                'message' => 'Build completed successfully',
                'output' => $bufferedOutput->fetch(),
            ], Response::HTTP_OK);
        } catch (\Throwable $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Build failed: ' . $e->getMessage(),
                'error' => $e->getMessage(),
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
