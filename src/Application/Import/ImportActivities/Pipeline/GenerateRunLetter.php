<?php

namespace App\Application\Import\ImportActivities\Pipeline;

use App\Domain\Letter\LetterGenerator;
use App\Domain\Letter\RunLetter;
use App\Domain\Letter\RunLetterRepository;
use App\Domain\Letter\StreakCalculator;
use App\Infrastructure\ValueObject\Measurement\UnitSystem;
use App\Infrastructure\ValueObject\Time\SerializableDateTime;
use Psr\Log\LoggerInterface;

final readonly class GenerateRunLetter implements ActivityImportStep
{
    public function __construct(
        private LetterGenerator $letterGenerator,
        private RunLetterRepository $letterRepository,
        private StreakCalculator $streakCalculator,
        private UnitSystem $unitSystem,
        private LoggerInterface $logger,
    ) {
    }

    public function process(ActivityImportContext $context): ActivityImportContext
    {
        $activity = $context->getActivity() ?? throw new \RuntimeException('Activity not set on $context');

        // Skip if letter already exists and this isn't a new activity
        if (!$context->isNewActivity() && $this->letterRepository->hasLetter($activity->getId())) {
            return $context;
        }

        // Only generate letters for running activities
        $sportType = strtolower((string) $activity->getSportType());
        if (!in_array($sportType, ['run', 'walk', 'hike', 'trailrun', 'virtualrun'], true)) {
            return $context;
        }

        try {
            // Calculate current streak
            $streakDay = $this->streakCalculator->getCurrentStreakDay($activity->getStartDate());

            // Generate the letter
            $letterText = $this->letterGenerator->generate($activity, $streakDay, $this->unitSystem);

            // Save the letter
            $letter = RunLetter::create(
                activityId: $activity->getId(),
                letterText: $letterText,
                generatedAt: SerializableDateTime::now(),
            );

            $this->letterRepository->save($letter);

            $this->logger->info('Generated run letter for activity', [
                'activityId' => (string) $activity->getId(),
                'streakDay' => $streakDay,
            ]);
        } catch (\Throwable $e) {
            // Log error but don't fail the import
            $this->logger->error('Failed to generate run letter', [
                'activityId' => (string) $activity->getId(),
                'error' => $e->getMessage(),
            ]);
        }

        return $context;
    }
}
