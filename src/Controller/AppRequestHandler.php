<?php

declare(strict_types=1);

namespace App\Controller;

use App\Domain\Strava\InsufficientStravaAccessTokenScopes;
use App\Domain\Strava\InvalidStravaAccessToken;
use App\Domain\Strava\Strava;
use League\Flysystem\FilesystemOperator;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Component\Routing\Attribute\Route;
use Twig\Environment;

#[AsController]
final readonly class AppRequestHandler
{
    public function __construct(
        private FilesystemOperator $buildStorage,
        private Strava $strava,
        private Environment $twig,
    ) {
    }

    #[Route(path: '/admin/{wildcard}', requirements: ['wildcard' => '.*'], methods: ['GET'], priority: -10)]
    public function handle(Request $request, ?string $wildcard = null): Response
    {
        // If this is a browser navigation request, always serve the app shell (index.html)
        // so the client-side router can take over.
        if ($request->headers->get('Sec-Fetch-Mode') === 'navigate' || $request->query->has('reload')) {
            if ($this->buildStorage->fileExists('index.html')) {
                return new Response($this->buildStorage->read('index.html'), Response::HTTP_OK);
            }
        }

        // For fetch requests (SPA navigation), try to find the matching HTML file.
        // e.g. /admin/run-letters -> run-letters.html
        if ($wildcard) {
            // Priority 1: Exact match (e.g. /admin/heatmap.html -> heatmap.html)
            if ($this->buildStorage->fileExists($wildcard)) {
                return new Response($this->buildStorage->read($wildcard), Response::HTTP_OK);
            }
            // Priority 2: Append .html (e.g. /admin/heatmap -> heatmap.html)
            $filename = $wildcard . '.html';
            if ($this->buildStorage->fileExists($filename)) {
                return new Response($this->buildStorage->read($filename), Response::HTTP_OK);
            }
        }

        // Fallback: If no specific file is found, or if it's the root /admin request, serve index.html
        if ($this->buildStorage->fileExists('index.html')) {
            return new Response($this->buildStorage->read('index.html'), Response::HTTP_OK);
        }

        try {
            $this->strava->verifyAccessToken();
        } catch (InvalidStravaAccessToken | InsufficientStravaAccessTokenScopes) {
            // Refresh token has not been set up properly or does not have the required scopes, initialize authorization flow.
            return new RedirectResponse('/strava-oauth', Response::HTTP_FOUND);
        }

        return new Response($this->twig->render('html/setup.html.twig'), Response::HTTP_OK);
    }
}
