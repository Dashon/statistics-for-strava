
export interface WeatherData {
  temperature: number;
  apparentTemperature?: number;
  windSpeed: number;
  windDirection?: number;
  precipitation?: number;
  conditionCode: number;
  conditionDescription: string;
}

/**
 * Interpret WMO Weather Interpretation Codes (WW)
 * https://open-meteo.com/en/docs
 */
function getWeatherDescription(code: number): string {
  if (code === 0) return "Clear sky";
  if (code === 1) return "Mainly clear";
  if (code === 2) return "Partly cloudy";
  if (code === 3) return "Overcast";
  if (code === 45 || code === 48) return "Foggy";
  if (code >= 51 && code <= 55) return "Drizzle";
  if (code >= 56 && code <= 57) return "Freezing Drizzle";
  if (code >= 61 && code <= 65) return "Rain";
  if (code >= 66 && code <= 67) return "Freezing Rain";
  if (code >= 71 && code <= 77) return "Snow";
  if (code >= 80 && code <= 82) return "Rain showers";
  if (code >= 85 && code <= 86) return "Snow showers";
  if (code >= 95) return "Thunderstorm";
  if (code >= 96 && code <= 99) return "Thunderstorm with hail";
  return "Unknown";
}

/**
 * Fetch current weather forecast for a location
 */
export async function fetchForecast(lat: number, lon: number): Promise<WeatherData | null> {
  try {
    const params = new URLSearchParams({
      latitude: lat.toString(),
      longitude: lon.toString(),
      current: "temperature_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m",
      wind_speed_unit: "kmh",
    });

    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
    if (!response.ok) throw new Error(`Weather API error: ${response.statusText}`);

    const data = await response.json();
    const current = data.current;

    return {
      temperature: current.temperature_2m,
      apparentTemperature: current.apparent_temperature,
      windSpeed: current.wind_speed_10m,
      windDirection: current.wind_direction_10m,
      precipitation: current.precipitation,
      conditionCode: current.weather_code,
      conditionDescription: getWeatherDescription(current.weather_code),
    };
  } catch (error) {
    console.error("Failed to fetch forecast:", error);
    return null;
  }
}

/**
 * Fetch historical weather for a specific timestamp
 * Uses the archive API
 */
export async function fetchHistoricalWeather(lat: number, lon: number, dateStr: string): Promise<WeatherData | null> {
  try {
    // Open-Meteo Archive requires start_date and end_date
    // dateStr should be YYYY-MM-DD
    const date = dateStr.split('T')[0];
    
    const params = new URLSearchParams({
      latitude: lat.toString(),
      longitude: lon.toString(),
      start_date: date,
      end_date: date,
      hourly: "temperature_2m,precipitation,weather_code,wind_speed_10m,wind_direction_10m",
      wind_speed_unit: "kmh",
    });

    const response = await fetch(`https://archive-api.open-meteo.com/v1/archive?${params}`);
    if (!response.ok) throw new Error(`Historical Weather API error: ${response.statusText}`);

    const data = await response.json();
    
    // We get hourly data array. Let's take the middle of the day (noon) or average?
    // For simplicity, let's take index 12 (12:00 PM) as a representative sample for "that day"
    // Or ideally, we'd match the activity start time, but keep it simple for now.
    const index = 12; 
    
    if (!data.hourly || !data.hourly.temperature_2m) return null;

    return {
      temperature: data.hourly.temperature_2m[index],
      windSpeed: data.hourly.wind_speed_10m[index],
      windDirection: data.hourly.wind_direction_10m[index],
      precipitation: data.hourly.precipitation[index],
      conditionCode: data.hourly.weather_code[index],
      conditionDescription: getWeatherDescription(data.hourly.weather_code[index]),
    };
  } catch (error) {
    console.error("Failed to fetch historical weather:", error);
    return null;
  }
}
