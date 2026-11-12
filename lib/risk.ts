export type RiskLevel = "Low" | "Moderate" | "High" | "Critical";

export type RiskFactorId =
  | "visitor_management"
  | "quarantine"
  | "cleaning_disinfection"
  | "feed_water_hygiene"
  | "waste_disposal"
  | "pest_control"
  | "vaccination_health";

export type RiskOption = {
  label: string;
  description: string;
  riskValue: number; // 0.0 to 1.0
};

export type RiskFactor = {
  id: RiskFactorId;
  name: string;
  weight: number; // percentage (sums to 100)
  description: string;
  pigSpecificNotes?: string;
  poultrySpecificNotes?: string;
  options: RiskOption[];
  recommendation: string;
};

export const RISK_FACTORS: RiskFactor[] = [
  {
    id: "visitor_management",
    name: "Visitor management",
    weight: 15,
    description: "Access controls, visitor registration logs, boot sanitation, and farm entry restrictions.",
    pigSpecificNotes: "Essential to prevent African Swine Fever (ASF) introduction via outside footwear and vehicles.",
    poultrySpecificNotes: "Protects flock against Avian Influenza fomite transfer from external personnel.",
    recommendation:
      "Install dedicated footbaths with certified disinfectant at all farm entrances. Maintain a mandatory visitor logbook and require external visitors to change into farm-dedicated footwear and overalls.",
    options: [
      {
        label: "Strict control & registration (No risk)",
        description: "All visitors logged, mandatory boot wash/change, vehicles restricted to perimeter.",
        riskValue: 0.0,
      },
      {
        label: "Regular logging with minor lapses (Low risk)",
        description: "Visitor log maintained, footbaths in place but disinfectant refreshed irregularly.",
        riskValue: 0.33,
      },
      {
        label: "Informal or sporadic visitor control (Moderate risk)",
        description: "No formal log; foot dips infrequently used or bypassed by some personnel.",
        riskValue: 0.67,
      },
      {
        label: "Unrestricted open access (Very high risk)",
        description: "Zero visitor logging, no footwear sanitation, and outside vehicles drive directly adjacent to pens.",
        riskValue: 1.0,
      },
    ],
  },
  {
    id: "quarantine",
    name: "Animal/bird quarantine",
    weight: 20,
    description: "Isolation protocols for new stock or returning animals, separate pens, and monitoring periods.",
    pigSpecificNotes: "Critical to avoid introducing African Swine Fever, PRRS, or Swine Dysentery from new herds.",
    poultrySpecificNotes: "Prevents asymptomatic carriers of Avian Influenza or Newcastle Disease from infecting the flock.",
    recommendation:
      "Establish an isolated quarantine unit at least 30 meters downwind from resident livestock. Hold all incoming or returned animals/birds for at least 21–30 days with daily clinical health checks.",
    options: [
      {
        label: "Dedicated quarantine unit ≥ 30 days (No risk)",
        description: "Strict isolation pen, dedicated equipment, and daily veterinary/health monitoring.",
        riskValue: 0.0,
      },
      {
        label: "Separate pen for 14–21 days (Low risk)",
        description: "Quarantine maintained for 2-3 weeks; separate pen with independent feeding.",
        riskValue: 0.33,
      },
      {
        label: "Short quarantine < 14 days or shared airspace (Moderate risk)",
        description: "Quarantine pen is adjacent to resident animals or held for under two weeks.",
        riskValue: 0.67,
      },
      {
        label: "Immediate herd/flock integration (Very high risk)",
        description: "New animals or birds mixed into the existing herd/flock immediately without isolation.",
        riskValue: 1.0,
      },
    ],
  },
  {
    id: "cleaning_disinfection",
    name: "Cleaning and disinfection",
    weight: 15,
    description: "Routine washing, chemical disinfection of coops/pens, all-in/all-out cycles, and vehicle tire dips.",
    pigSpecificNotes: "African Swine Fever virus survives in organic matter; thorough high-pressure wash is vital.",
    poultrySpecificNotes: "Ensures viral inactivation between flock placements and reduces bacterial load.",
    recommendation:
      "Enforce an all-in/all-out batch system with thorough organic debris removal, hot pressure washing, and certified virucidal disinfectant application. Refresh vehicle disinfection baths twice weekly.",
    options: [
      {
        label: "Scheduled all-in/all-out chemical disinfection (No risk)",
        description: "Comprehensive washing and certified broad-spectrum disinfection between cycles; tire dips active.",
        riskValue: 0.0,
      },
      {
        label: "Regular cleaning with scheduled disinfection (Low risk)",
        description: "Pens washed and disinfected periodically; tire wash functional but rarely tested.",
        riskValue: 0.33,
      },
      {
        label: "Occasional water washing with minimal chemical disinfectant (Moderate risk)",
        description: "Pressure washing done without full organic removal; chemical disinfection skipped often.",
        riskValue: 0.67,
      },
      {
        label: "No routine disinfection or tire dip (Very high risk)",
        description: "Sheds not disinfected between animal cycles; zero vehicle tire or equipment sanitation.",
        riskValue: 1.0,
      },
    ],
  },
  {
    id: "feed_water_hygiene",
    name: "Feed and water hygiene",
    weight: 10,
    description: "Storage of animal feed in sealed bins, potable tested water, and avoidance of untreated swill.",
    pigSpecificNotes: "Swill/kitchen scrap feeding is the #1 vector for African Swine Fever. Never feed untreated food scraps.",
    poultrySpecificNotes: "Prevents waterborne Salmonella and contamination from wild bird droppings in water tanks.",
    recommendation:
      "Store all feed in elevated, enclosed rodent-proof silos or sealed containers. Ensure all drinking water is tested and chlorinated or from certified deep boreholes. Strictly prohibit swill feeding.",
    options: [
      {
        label: "Enclosed silos, tested water, zero swill (No risk)",
        description: "Feed stored in moisture-proof sealed containers; treated water; swill feeding strictly prohibited.",
        riskValue: 0.0,
      },
      {
        label: "Enclosed feed room, clean borehole water (Low risk)",
        description: "Feed kept off ground in dry room; clean tested water; commercial compound feed only.",
        riskValue: 0.33,
      },
      {
        label: "Open feed storage, untreated surface water (Moderate risk)",
        description: "Feed sacks open to ambient air; surface water used without filtration.",
        riskValue: 0.67,
      },
      {
        label: "Exposed feed, canal water, or swill feeding practiced (Very high risk)",
        description: "Feed accessible to birds/pests; canal/pond water; kitchen waste or swill fed to animals.",
        riskValue: 1.0,
      },
    ],
  },
  {
    id: "waste_disposal",
    name: "Waste and carcass disposal",
    weight: 15,
    description: "Disposal of livestock mortalities, deep burial with quicklime, incinerators, and manure zoning.",
    pigSpecificNotes: "Carcasses of infected pigs carry high viral loads; rapid burial with lime prevents transmission.",
    poultrySpecificNotes: "Prompt removal of daily mortalities prevents flies, predators, and botulism/HPAI spread.",
    recommendation:
      "Construct a predator-proof deep burial pit (at least 2 meters deep) with generous quicklime dressing, or utilize an on-site incinerator. Ensure manure composting is segregated downwind from water sources.",
    options: [
      {
        label: "Immediate deep burial with lime or incineration (No risk)",
        description: "Mortalities removed within 2 hours to a secured, fenced deep pit with quicklime or incinerator.",
        riskValue: 0.0,
      },
      {
        label: "Daily burial in covered pit (Low risk)",
        description: "Carcasses collected daily and buried in designated disposal pit; manure composted.",
        riskValue: 0.33,
      },
      {
        label: "Delayed carcass disposal > 12 hours (Moderate risk)",
        description: "Mortalities stored in open bins or shallow pits with insufficient lime cover.",
        riskValue: 0.67,
      },
      {
        label: "Open disposal or accessible to scavengers (Very high risk)",
        description: "Dead animals left exposed outside sheds or discarded in open fields where predators roam.",
        riskValue: 1.0,
      },
    ],
  },
  {
    id: "pest_control",
    name: "Pest control",
    weight: 10,
    description: "Rodent baiting, wild bird exclusion netting, fly/insect traps, and perimeter vegetation clearing.",
    pigSpecificNotes: "Rodents and feral pigs can transmit African Swine Fever and Leptospirosis.",
    poultrySpecificNotes: "Wild migratory birds are the primary vector for Highly Pathogenic Avian Influenza (HPAI).",
    recommendation:
      "Inspect and repair all shed wire netting (≤1 inch mesh) to physically bar wild birds from entering coops. Maintain tamper-resistant rodent baiting stations at 15-meter intervals along perimeter fencing.",
    options: [
      {
        label: "Intact bird netting and active rodent bait stations (No risk)",
        description: "Fine mesh on all openings completely excludes wild birds; perimeter bait stations maintained.",
        riskValue: 0.0,
      },
      {
        label: "Netting intact with minor gaps, regular rodent trapping (Low risk)",
        description: "Wild birds largely excluded; rodent traps checked and reset bi-weekly.",
        riskValue: 0.33,
      },
      {
        label: "Partial netting and sporadic pest control (Moderate risk)",
        description: "Visible openings where wild birds enter; evidence of rodent activity around feed.",
        riskValue: 0.67,
      },
      {
        label: "No netting, open sheds, heavy rodent presence (Very high risk)",
        description: "Open-sided housing with free access for wild birds and rodents; no pest control measures.",
        riskValue: 1.0,
      },
    ],
  },
  {
    id: "vaccination_health",
    name: "Vaccination and health monitoring",
    weight: 15,
    description: "Preventive vaccine schedules, daily clinical symptom checks, mortality logs, and veterinary consultation.",
    pigSpecificNotes: "Routine monitoring for fever, skin lesions, and sudden mortality indicative of ASF or Erysipelas.",
    poultrySpecificNotes: "Daily inspection for respiratory distress, facial edema, drop in egg production, or mortality spikes.",
    recommendation:
      "Coordinate with a licensed veterinarian to enforce a tailored vaccination schedule. Keep an updated daily flock/herd log recording feed intake, clinical anomalies, and mortality trends.",
    options: [
      {
        label: "Complete veterinary vaccine plan & daily written logs (No risk)",
        description: "All core vaccines administered; written daily mortality/morbidity log; regular vet visits.",
        riskValue: 0.0,
      },
      {
        label: "Core vaccines given, visual daily monitoring (Low risk)",
        description: "Key vaccinations up-to-date; daily health inspection done with informal logging.",
        riskValue: 0.33,
      },
      {
        label: "Incomplete vaccination or irregular health checks (Moderate risk)",
        description: "Missed boosters; health observations made only when severe illness occurs.",
        riskValue: 0.67,
      },
      {
        label: "No vaccination program and zero health tracking (Very high risk)",
        description: "No vaccines administered; disease outbreaks not documented; no veterinary support.",
        riskValue: 1.0,
      },
    ],
  },
];

export function calculateRiskScore(ratings: Record<RiskFactorId, number>): {
  score: number;
  classification: RiskLevel;
  weightedContributions: Record<RiskFactorId, number>;
  totalWeight: number;
} {
  let numerator = 0;
  let denominator = 0;
  const weightedContributions: Record<RiskFactorId, number> = {
    visitor_management: 0,
    quarantine: 0,
    cleaning_disinfection: 0,
    feed_water_hygiene: 0,
    waste_disposal: 0,
    pest_control: 0,
    vaccination_health: 0,
  };

  for (const factor of RISK_FACTORS) {
    const r_i = ratings[factor.id] ?? 0;
    const w_i = factor.weight;
    const contribution = w_i * r_i;

    weightedContributions[factor.id] = Math.round(contribution * 10) / 10;
    numerator += contribution;
    denominator += w_i;
  }

  const score = denominator > 0 ? (numerator / denominator) * 100 : 0;
  const roundedScore = Math.round(score * 10) / 10;

  return {
    score: roundedScore,
    classification: classifyRisk(roundedScore),
    weightedContributions,
    totalWeight: denominator,
  };
}

export function classifyRisk(score: number): RiskLevel {
  if (score <= 25) return "Low";
  if (score <= 50) return "Moderate";
  if (score <= 75) return "High";
  return "Critical";
}
