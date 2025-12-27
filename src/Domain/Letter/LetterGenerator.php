<?php

namespace App\Domain\Letter;

use App\Domain\Activity\Activity;
use App\Infrastructure\ValueObject\Measurement\UnitSystem;

final readonly class LetterGenerator
{
    public function __construct(
        private string $claudeApiKey,
    ) {
    }

    public function generate(Activity $activity, int $streakDay, UnitSystem $unitSystem): string
    {
        $context = $this->buildContext($activity, $streakDay, $unitSystem);
        $prompt = $this->buildPrompt($context);

        return $this->callClaudeAPI($prompt);
    }

    private function buildContext(Activity $activity, int $streakDay, UnitSystem $unitSystem): array
    {
        $distance = $activity->getDistanceInKilometer();
        $distanceValue = match ($unitSystem) {
            UnitSystem::METRIC => round($distance->toFloat(), 2),
            UnitSystem::IMPERIAL => round($distance->toFloat() * 0.621371, 2),
        };
        $distanceUnit = match ($unitSystem) {
            UnitSystem::METRIC => 'km',
            UnitSystem::IMPERIAL => 'miles',
        };

        // Calculate pace
        $movingTimeSeconds = $activity->getMovingTime();
        $paceSecPerKm = $movingTimeSeconds / max($distance->toFloat(), 0.1);
        $paceSecPerMile = $paceSecPerKm * 1.60934;

        $pace = match ($unitSystem) {
            UnitSystem::METRIC => $this->formatPace($paceSecPerKm),
            UnitSystem::IMPERIAL => $this->formatPace($paceSecPerMile),
        };
        $paceUnit = match ($unitSystem) {
            UnitSystem::METRIC => '/km',
            UnitSystem::IMPERIAL => '/mile',
        };

        // Analyze splits for pacing pattern
        $splits = $this->analyzeSplits($activity);

        return [
            'distance' => $distanceValue,
            'distanceUnit' => $distanceUnit,
            'pace' => $pace,
            'paceUnit' => $paceUnit,
            'time' => $this->formatDuration($movingTimeSeconds),
            'heartRate' => $activity->getAverageHeartRate(),
            'elevationGain' => $activity->getElevationGain(),
            'streakDay' => $streakDay,
            'splitPattern' => $splits,
            'name' => $activity->getName(),
            'sportType' => (string) $activity->getSportType(),
        ];
    }

    private function formatPace(float $secondsPerUnit): string
    {
        $minutes = floor($secondsPerUnit / 60);
        $seconds = round($secondsPerUnit % 60);

        return sprintf('%d:%02d', $minutes, $seconds);
    }

    private function formatDuration(int $seconds): string
    {
        $hours = floor($seconds / 3600);
        $minutes = floor(($seconds % 3600) / 60);
        $secs = $seconds % 60;

        if ($hours > 0) {
            return sprintf('%d:%02d:%02d', $hours, $minutes, $secs);
        }

        return sprintf('%d:%02d', $minutes, $secs);
    }

    private function analyzeSplits(Activity $activity): string
    {
        // Simple heuristic based on heart rate if available
        $hr = $activity->getAverageHeartRate();
        if (!$hr) {
            return 'steady effort';
        }

        if ($hr < 140) {
            return 'easy, conversational pace';
        } elseif ($hr < 160) {
            return 'moderate, controlled effort';
        } else {
            return 'hard effort, pushing the pace';
        }
    }

    private function buildPrompt(array $context): string
    {
        return <<<PROMPT
You are writing a short, reflective letter about a running activity.

Run details:
- Distance: {$context['distance']} {$context['distanceUnit']}
- Pace: {$context['pace']}{$context['paceUnit']}
- Time: {$context['time']}
- Heart rate: {$context['heartRate']} bpm (if available)
- Elevation gain: {$context['elevationGain']} meters
- Streak day: {$context['streakDay']}
- Effort: {$context['splitPattern']}
- Activity name: {$context['name']}

Write a 2-3 sentence reflection in second person ("you").
Tone: calm, observant, grounded, non-judgmental, thoughtful.
Focus on consistency and showing up, not performance.
Acknowledge effort patterns and what the run taught or revealed.

Examples of good letters:
"4.3 miles. You didn't push today. The streak mattered more than the pace. Showing up counts, especially on days like this."

"6 miles at dawn. Your legs felt heavy but you found rhythm by mile 3. Some runs teach you patience."

"Another morning, another run. The consistency is building something you can't see yet, but you feel it in the ease of lacing up."

"You moved through the miles like you've done this before. Because you have. Day {$context['streakDay']} of showing up."

Write the letter (2-3 sentences, no preamble, just the letter text):
PROMPT;
    }

    private function callClaudeAPI(string $prompt): string
    {
        $url = 'https://api.anthropic.com/v1/messages';

        $data = [
            'model' => 'claude-3-5-sonnet-20241022',
            'max_tokens' => 150,
            'messages' => [
                [
                    'role' => 'user',
                    'content' => $prompt,
                ],
            ],
        ];

        $headers = [
            'Content-Type: application/json',
            'x-api-key: '.$this->claudeApiKey,
            'anthropic-version: 2023-06-01',
        ];

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if (200 !== $httpCode) {
            throw new \RuntimeException("Claude API request failed with code {$httpCode}: {$response}");
        }

        $result = json_decode($response, true);

        if (!isset($result['content'][0]['text'])) {
            throw new \RuntimeException('Invalid response from Claude API');
        }

        return trim($result['content'][0]['text']);
    }
}
