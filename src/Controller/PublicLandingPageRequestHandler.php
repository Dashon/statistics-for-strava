<?php

declare(strict_types=1);

namespace App\Controller;

use App\Domain\Activity\ActivityRepository;
use App\Domain\Athlete\AthleteRepository;
use App\Domain\Letter\RunLetterRepository;
use App\Domain\Letter\StreakCalculator;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Component\Routing\Attribute\Route;
use Twig\Environment;

#[AsController]
final readonly class PublicLandingPageRequestHandler
{
    public function __construct(
        private RunLetterRepository $letterRepository,
        private ActivityRepository $activityRepository,
        private AthleteRepository $athleteRepository,
        private StreakCalculator $streakCalculator,
        private Environment $twig,
    ) {
    }

    #[Route(path: '/', methods: ['GET'], priority: 10)]
    public function handle(): Response
    {
        try {
            $athlete = $this->athleteRepository->find();

            // Get all public letters
            $allLetters = $this->letterRepository->findAll();
            $publicLetters = array_filter($allLetters, fn($letter) => $letter->isPublic());

            // Get latest public letter with activity
            $latestLetter = null;
            $latestActivity = null;

            if (!empty($publicLetters)) {
                // Sort by most recent
                usort($publicLetters, function($a, $b) {
                    return $b->getGeneratedAt()->getTimestamp() <=> $a->getGeneratedAt()->getTimestamp();
                });

                $latestLetter = $publicLetters[0];
                $latestActivity = $this->activityRepository->find($latestLetter->getActivityId());
            }

            // Get current streak
            $currentStreak = $this->streakCalculator->getCurrentStreakDay();

            return new Response(
                $this->twig->render('html/public-landing.html.twig', [
                    'athlete' => $athlete,
                    'latestLetter' => $latestLetter,
                    'latestActivity' => $latestActivity,
                    'currentStreak' => $currentStreak,
                    'totalPublicLetters' => count($publicLetters),
                ]),
                Response::HTTP_OK
            );
        } catch (\Exception $e) {
            // If athlete not found or other error, show simple landing page
            return new Response(
                $this->twig->render('html/public-landing.html.twig', [
                    'athlete' => null,
                    'latestLetter' => null,
                    'latestActivity' => null,
                    'currentStreak' => 0,
                    'totalPublicLetters' => 0,
                ]),
                Response::HTTP_OK
            );
        }
    }
}
