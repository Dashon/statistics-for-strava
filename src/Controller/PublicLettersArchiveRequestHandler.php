<?php

declare(strict_types=1);

namespace App\Controller;

use App\Domain\Activity\ActivityRepository;
use App\Domain\Athlete\AthleteRepository;
use App\Domain\Letter\RunLetterRepository;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Component\Routing\Attribute\Route;
use Twig\Environment;

#[AsController]
final readonly class PublicLettersArchiveRequestHandler
{
    public function __construct(
        private RunLetterRepository $letterRepository,
        private ActivityRepository $activityRepository,
        private AthleteRepository $athleteRepository,
        private Environment $twig,
    ) {
    }

    #[Route(path: '/letters', methods: ['GET'])]
    public function handle(): Response
    {
        // Get all public letters
        $letters = $this->letterRepository->findAll();

        // Filter only public letters and enrich with activity data
        $enrichedLetters = [];
        foreach ($letters as $letter) {
            if (!$letter->isPublic()) {
                continue;
            }

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

        try {
            $athlete = $this->athleteRepository->find();
        } catch (\Exception $e) {
            $athlete = null;
        }

        return new Response(
            $this->twig->render('html/run-letters/letters-archive.html.twig', [
                'enrichedLetters' => $enrichedLetters,
                'totalLetters' => count($enrichedLetters),
                'athlete' => $athlete,
            ]),
            Response::HTTP_OK
        );
    }
}
