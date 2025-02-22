import { locationTypes, HARDCORE_AREAS } from "../store/marketSlice";

export interface LocationIntel {
  description: string;
  drugActivity: string[];
  crimeAffiliations: string[];
  policeActivity: string;
  riskLevel: number; // 0-100
  commonEvents: string[];
  primaryDrugs: string[];
}

// Define location type keys
type LocationType = keyof typeof locationTypes;

// Define hardcore areas type to match the constant from marketSlice
type HardcoreArea = typeof HARDCORE_AREAS[number]; // This is better than manually listing them

// Helper function to determine location type
const getLocationType = (location: string): LocationType => {
  // Type guard for hardcore areas
  const isHardcoreArea = (loc: string): loc is HardcoreArea => {
    return (HARDCORE_AREAS as readonly string[]).includes(loc);
  };

  // Hardcore areas are typically high-risk zones
  if (isHardcoreArea(location)) {
    return "hardcoreArea";
  }

  // Party districts and nightlife areas
  if (location.includes("Valley") || location.includes("Paradise") || location.includes("Cross")) {
    return "partyArea";
  }

  // Major city centers
  if (location.includes("CBD") || location.includes("Central") || location === "Civic") {
    return "cityCenter";
  }

  // Gang territories (could expand this list)
  if (location === "Broadmeadows" || location === "Inala" || location === "Cabramatta") {
    return "gangTerritory";
  }

  // Rural towns
  if (location === "Moe" || location === "Katherine" || location === "Tennant Creek") {
    return "ruralTown";
  }

  // Default to suburb if no other match
  return "suburb";
};

export const locationIntelligence: Record<string, LocationIntel> = {
  // New South Wales - Major Drug Hubs
  "Kings Cross": {
    description: "Sydney's notorious red-light district and historical drug marketplace. The 1980s saw heroin dominate, while modern trade focuses on cocaine and party drugs.",
    drugActivity: [
      "Major cocaine distribution hub",
      "High-end party drug scene",
      "Historical heroin hotspot",
      "Nightclub drug trade"
    ],
    crimeAffiliations: [
      "John Ibrahim's crew",
      "Eastern European syndicates",
      "Asian crime networks"
    ],
    policeActivity: "Heavy police presence, especially weekends. Undercover operations frequent. CCTV covers every corner.",
    riskLevel: 80,
    commonEvents: ["kings_cross_incident", "police_raid", "gang_war"],
    primaryDrugs: ["Cocaine", "MDMA", "Ice", "Heroin"]
  },

  "Cabramatta": {
    description: "Former 'heroin capital' of Australia, now evolved into a diverse drug marketplace with strong Asian crime influence.",
    drugActivity: [
      "Historical heroin epicenter",
      "Modern ice distribution",
      "Asian syndicate operations",
      "Street-level dealing"
    ],
    crimeAffiliations: [
      "5T Gang (historical)",
      "Vietnamese crime networks",
      "Chinese triads"
    ],
    policeActivity: "Regular police operations, focus on rail corridor and shopping centers.",
    riskLevel: 70,
    commonEvents: ["gang_war", "police_raid", "bikie_shakedown"],
    primaryDrugs: ["Heroin", "Ice", "MDMA"]
  },

  // Victoria - Major Centers
  "Richmond": {
    description: "Melbourne's historical heroin district, now a mixed drug market with persistent street trade.",
    drugActivity: [
      "Historical heroin zone",
      "Street-level dealing",
      "Mixed drug market",
      "Safe injecting room impact"
    ],
    crimeAffiliations: [
      "Vietnamese gangs",
      "Local street crews",
      "Independent dealers"
    ],
    policeActivity: "Regular patrols, focus around Victoria Street and housing estates.",
    riskLevel: 65,
    commonEvents: ["police_raid", "gang_war"],
    primaryDrugs: ["Heroin", "Ice", "Cocaine"]
  },

  "Footscray": {
    description: "Western Melbourne's drug hub, historically known for heroin trade via Vietnamese networks.",
    drugActivity: [
      "Asian heroin networks",
      "Street market drugs",
      "Mixed substance trade",
      "Market-based dealing"
    ],
    crimeAffiliations: [
      "Vietnamese syndicates",
      "West Melbourne crews",
      "Market vendors"
    ],
    policeActivity: "Focus on market area and train station precinct.",
    riskLevel: 60,
    commonEvents: ["gang_war", "police_raid"],
    primaryDrugs: ["Heroin", "Ice", "MDMA"]
  },

  // Queensland Hotspots
  "Fortitude Valley": {
    description: "Brisbane's nightlife district and major party drug marketplace.",
    drugActivity: [
      "Nightclub drug scene",
      "Party drug distribution",
      "Street-level dealing",
      "Late-night trade"
    ],
    crimeAffiliations: [
      "Nightclub networks",
      "Bikie affiliates",
      "Street dealers"
    ],
    policeActivity: "Heavy weekend presence, undercover operations in nightclubs.",
    riskLevel: 55,
    commonEvents: ["police_raid", "gang_war"],
    primaryDrugs: ["MDMA", "Cocaine", "Ice"]
  },

  // Add more locations following the same pattern...
};

// Helper function to get intel for any location
export const getLocationIntel = (location: string): LocationIntel => {
  if (locationIntelligence[location]) {
    return locationIntelligence[location];
  }

  const locationType = getLocationType(location);
  // Cast HARDCORE_AREAS to string[] for the includes check
  const isHardcore = (HARDCORE_AREAS as readonly string[]).includes(location);

  const genericIntel: LocationIntel = {
    description: `${location} is a ${isHardcore ? 'high-risk' : 'typical'} ${locationType} drug market.`,
    drugActivity: locationTypes[locationType].drugs.map((drug: string) => `${drug} distribution`),
    crimeAffiliations: ["Local dealers", "Street crews"],
    policeActivity: `Regular patrols with ${locationTypes[locationType].policeRisk * 100}% risk factor.`,
    riskLevel: locationTypes[locationType].policeRisk * 100,
    commonEvents: ["police_raid", "gang_war"],
    primaryDrugs: locationTypes[locationType].drugs
  };

  return genericIntel;
}; 