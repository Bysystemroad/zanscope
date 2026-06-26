import { Lead } from "@/lib/dummy-data";

type GooglePlace = {
  id?: string;
  displayName?: {
    text?: string;
  };
  websiteUri?: string;
  internationalPhoneNumber?: string;
  formattedAddress?: string;
};

type PlacesSearchResponse = {
  places?: GooglePlace[];
  error?: {
    code?: number;
    message?: string;
    status?: string;
  };
};

export type PlacesSearchPayload = {
  keyword: string;
  city: string;
  country: string;
};

export type PlacesSearchResult = {
  leads: Lead[];
  source: "Zanscope Intelligence";
  fallback: boolean;
  places_api_used: boolean;
  api_error: string | null;
};

function errorResult(apiError: string, placesApiUsed: boolean): PlacesSearchResult {
  return {
    leads: [],
    source: "Zanscope Intelligence",
    fallback: false,
    places_api_used: placesApiUsed,
    api_error: apiError
  };
}

function classifyPlacesError(status: number, message: string) {
  const lowerMessage = message.toLowerCase();

  if (status === 429 || lowerMessage.includes("quota")) {
    return `Places API quota exceeded: ${message}`;
  }

  if (
    lowerMessage.includes("not enabled") ||
    lowerMessage.includes("has not been used") ||
    lowerMessage.includes("api has not been used")
  ) {
    return `Places API is not enabled: ${message}`;
  }

  return `Google Places API error (${status}): ${message}`;
}

async function readPlacesError(response: Response) {
  try {
    const data = (await response.json()) as PlacesSearchResponse;
    return data.error?.message || data.error?.status || JSON.stringify(data);
  } catch {
    return await response.text().catch(() => response.statusText);
  }
}

export async function searchGooglePlaces(payload: Partial<PlacesSearchPayload>): Promise<PlacesSearchResult> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const keyword = payload.keyword?.trim();
  const city = payload.city?.trim();
  const country = payload.country?.trim();

  if (!apiKey) {
    return errorResult("GOOGLE_PLACES_API_KEY is missing. Add it to .env.local and restart the dev server.", false);
  }

  if (!keyword || !city || !country) {
    return errorResult("Keyword, city, and country are required for Google Places search.", false);
  }

  let response: Response;

  try {
    response = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask":
          "places.id,places.displayName,places.websiteUri,places.internationalPhoneNumber,places.formattedAddress"
      },
      body: JSON.stringify({
        textQuery: `${keyword} in ${city}, ${country}`,
        maxResultCount: 10
      })
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return errorResult(`Google Places API request failed: ${message}`, true);
  }

  if (!response.ok) {
    const message = await readPlacesError(response);
    return errorResult(classifyPlacesError(response.status, message), true);
  }

  let data: PlacesSearchResponse;

  try {
    data = (await response.json()) as PlacesSearchResponse;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return errorResult(`Google Places API returned invalid JSON: ${message}`, true);
  }

  const places = data.places || [];

  return {
    leads: places.map((place, index) => ({
      id: place.id || `business_lead_${index + 1}`,
      company_name: place.displayName?.text || "Unknown company",
      website: place.websiteUri || "",
      email: "",
      phone: place.internationalPhoneNumber || "",
      address: place.formattedAddress || "",
      city,
      country,
      source: "Zanscope Intelligence",
      scraper_status: "pending",
      duplicate_count: 1,
      lead_score: 0,
      lead_quality: "Low Quality",
      internal_sources: ["Business intelligence engine"],
      internal_source_count: 1,
      created_at: new Date().toISOString()
    })),
    source: "Zanscope Intelligence",
    fallback: false,
    places_api_used: true,
    api_error: null
  };
}
