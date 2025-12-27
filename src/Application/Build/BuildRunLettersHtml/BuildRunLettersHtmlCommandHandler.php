<?php

declare(strict_types=1);

namespace App\Application\Build\BuildRunLettersHtml;

use App\Domain\Activity\ActivityRepository;
use App\Domain\Letter\RunLetterRepository;
use App\Domain\Letter\StreakCalculator;
use App\Infrastructure\CQRS\Command\Command;
use App\Infrastructure\CQRS\Command\CommandHandler;
use League\Flysystem\FilesystemOperator;
use Twig\Environment;

final readonly class BuildRunLettersHtmlCommandHandler implements CommandHandler
{
    public function __construct(
        private RunLetterRepository $letterRepository,
        private ActivityRepository $activityRepository,
        private StreakCalculator $streakCalculator,
        private Environment $twig,
        private FilesystemOperator $buildStorage,
    ) {
    }

    public function handle(Command $command): void
    {
        assert($command instanceof BuildRunLettersHtml);

        // Get all letters
        $letters = $this->letterRepository->findAll();

        // Enrich letters with activity data
        $enrichedLetters = [];
        foreach ($letters as $letter) {
            try {
                $activity = $this->activityRepository->find($letter->getActivityId());
                if ($activity) {
                    $enrichedLetters[] = [
                        'letter' => $letter,
                        'activity' => $activity,
                    ];
                }
            } catch (\Exception $e) {
                // Skip if activity not found
                continue;
            }
        }

        // Sort by activity date descending
        usort($enrichedLetters, function ($a, $b) {
            return $b['activity']->getStartDate()->getTimestamp() <=> $a['activity']->getStartDate()->getTimestamp();
        });

        // Calculate current streak
        $currentStreak = $this->streakCalculator->getCurrentStreakDay();

        // Render and save
        $this->buildStorage->write(
            'run-letters.html',
            $this->twig->load('html/run-letters/run-letters.html.twig')->render([
                'enrichedLetters' => $enrichedLetters,
                'totalLetters' => count($enrichedLetters),
                'currentStreak' => $currentStreak,
            ]),
        );
    }
}
