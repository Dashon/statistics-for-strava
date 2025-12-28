<?php

declare(strict_types=1);

namespace App\Application\Backfill;

use App\Domain\Activity\ActivityRepository;
use App\Domain\Activity\SportType\SportType;
use App\Domain\Letter\LetterGenerator;
use App\Domain\Letter\RunLetter;
use App\Domain\Letter\RunLetterRepository;
use App\Domain\Letter\StreakCalculator;
use App\Infrastructure\ValueObject\Measurement\UnitSystem;
use App\Infrastructure\ValueObject\Time\SerializableDateTime;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'app:backfill:run-letters',
    description: 'Generate Run Letters for existing running activities',
)]
final class BackfillRunLettersCommand extends Command
{
    public function __construct(
        private readonly ActivityRepository $activityRepository,
        private readonly RunLetterRepository $letterRepository,
        private readonly LetterGenerator $letterGenerator,
        private readonly StreakCalculator $streakCalculator,
        private readonly UnitSystem $unitSystem,
    ) {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);

        $io->title('Backfilling Run Letters');

        // Get all activities
        $allActivities = $this->activityRepository->findAll();

        // Filter for running activities only
        $runningActivities = array_filter($allActivities->getIterator()->getArrayCopy(), function ($activity) {
            $sportType = strtolower($activity->getSportType()->value);
            return in_array($sportType, ['run', 'walk', 'hike', 'trailrun', 'virtualrun'], true);
        });

        // Sort by date ascending (oldest first)
        usort($runningActivities, function ($a, $b) {
            return $a->getStartDate()->getTimestamp() <=> $b->getStartDate()->getTimestamp();
        });

        $totalActivities = count($runningActivities);
        $io->info(sprintf('Found %d running activities', $totalActivities));

        $generated = 0;
        $skipped = 0;
        $errors = 0;

        $io->progressStart($totalActivities);

        foreach ($runningActivities as $activity) {
            try {
                // Skip if letter already exists
                if ($this->letterRepository->hasLetter($activity->getId())) {
                    $skipped++;
                    $io->progressAdvance();
                    continue;
                }

                // Calculate streak at the time of this activity
                $streakDay = $this->streakCalculator->getCurrentStreakDay($activity->getStartDate());

                // Generate letter
                $letterText = $this->letterGenerator->generate($activity, $streakDay, $this->unitSystem);

                // Save letter
                $letter = RunLetter::create(
                    activityId: $activity->getId(),
                    letterText: $letterText,
                    generatedAt: SerializableDateTime::now(),
                );

                $this->letterRepository->save($letter);
                $generated++;

            } catch (\Throwable $e) {
                $errors++;
                $io->error(sprintf(
                    'Failed to generate letter for activity %s: %s',
                    $activity->getId(),
                    $e->getMessage()
                ));
            }

            $io->progressAdvance();
        }

        $io->progressFinish();

        $io->success(sprintf(
            'Backfill complete! Generated: %d, Skipped: %d, Errors: %d',
            $generated,
            $skipped,
            $errors
        ));

        return Command::SUCCESS;
    }
}
