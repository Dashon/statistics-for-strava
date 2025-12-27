<?php

declare(strict_types=1);

namespace App\Controller;

use App\Domain\Activity\ActivityId;
use App\Domain\Letter\RunLetterRepository;
use App\Infrastructure\ValueObject\Time\SerializableDateTime;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Component\Routing\Attribute\Route;

#[AsController]
final readonly class RunLetterApiRequestHandler
{
    public function __construct(
        private RunLetterRepository $letterRepository,
    ) {
    }

    #[Route(path: '/api/run-letter/{activityId}/edit', methods: ['POST'])]
    public function editLetter(Request $request, string $activityId): Response
    {
        $data = json_decode($request->getContent(), true);
        $newText = $data['text'] ?? null;

        if (!$newText) {
            return new JsonResponse(['error' => 'Text is required'], Response::HTTP_BAD_REQUEST);
        }

        $letter = $this->letterRepository->find(ActivityId::fromString($activityId));
        if (!$letter) {
            return new JsonResponse(['error' => 'Letter not found'], Response::HTTP_NOT_FOUND);
        }

        $updatedLetter = $letter->edit($newText, SerializableDateTime::now());
        $this->letterRepository->save($updatedLetter);

        return new JsonResponse(['success' => true, 'text' => $updatedLetter->getLetterText()]);
    }

    #[Route(path: '/api/run-letter/{activityId}/toggle-public', methods: ['POST'])]
    public function togglePublic(string $activityId): Response
    {
        $letter = $this->letterRepository->find(ActivityId::fromString($activityId));
        if (!$letter) {
            return new JsonResponse(['error' => 'Letter not found'], Response::HTTP_NOT_FOUND);
        }

        $updatedLetter = $letter->isPublic() ? $letter->makePrivate() : $letter->makePublic();
        $this->letterRepository->save($updatedLetter);

        return new JsonResponse([
            'success' => true,
            'isPublic' => $updatedLetter->isPublic(),
            'shareUrl' => $updatedLetter->isPublic() && $updatedLetter->getShareToken()
                ? '/letter/' . $updatedLetter->getShareToken()
                : null,
        ]);
    }
}
