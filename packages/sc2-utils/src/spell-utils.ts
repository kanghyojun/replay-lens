// Utility functions for spell display

// Get display name for spell
export function getSpellDisplayName(spellName: string): string {
  const displayNames: Record<string, string> = {
    'ChronoBoost': 'Chrono Boost',
    'ChronoBoostEnergyCost': 'Chrono Boost',
    'BatteryOvercharge': 'Battery Overcharge',
    'InjectLarva': 'Inject Larva',
    'CalldownMULE': 'MULE',
  };

  return displayNames[spellName] || spellName;
}

// Get abbreviated spell name
export function getSpellAbbreviation(spellName: string): string {
  const abbreviations: Record<string, string> = {
    'ChronoBoost': 'CB',
    'ChronoBoostEnergyCost': 'CB',
    'BatteryOvercharge': 'BO',
    'InjectLarva': 'IL',
    'CalldownMULE': 'MULE',
  };

  return abbreviations[spellName] || spellName.slice(0, 2);
}
