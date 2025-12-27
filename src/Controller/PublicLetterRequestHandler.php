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
final readonly class PublicLetterRequestHandler
{
    public function __construct(
        private RunLetterRepository $letterRepository,
        private ActivityRepository $activityRepository,
        private AthleteRepository $athleteRepository,
        private Environment $twig,
    ) {
    }

    #[Route(path: '/letter/{token}', methods: ['GET'])]
    public function handle(string $token): Response
    {
        $letter = $this->letterRepository->findByShareToken($token);

        if (!$letter || !$letter->isPublic()) {
            return new Response(
                $this->twig->render('html/run-letters/letter-not-found.html.twig'),
                Response::HTTP_NOT_FOUND
            );
        }

        try {
            $activity = $this->activityRepository->find($letter->getActivityId());
            $athlete = $this->athleteRepository->find();

            return new Response(
                $this->twig->render('html/run-letters/public-letter.html.twig', [
                    'letter' => $letter,
                    'activity' => $activity,
                    'athlete' => $athlete,
                ]),
                Response::HTTP_OK
            );
        } catch (\Exception $e) {
            return new Response(
                $this->twig->render('html/run-letters/letter-not-found.html.twig'),
                Response::HTTP_NOT_FOUND
            );
        }
    }
}
