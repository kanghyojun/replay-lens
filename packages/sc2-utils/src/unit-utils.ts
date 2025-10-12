// Utility functions for unit/upgrade abbreviations

// Utility function to abbreviate unit/building names
export function abbreviateUnitName(unitName: string): string {
  // Common abbreviations
  const abbreviations: Record<string, string> = {
    // Protoss
    'Pylon': 'Py',
    'Gateway': 'Gw',
    'CyberneticsCore': 'Cy',
    'Forge': 'Fo',
    'PhotonCannon': 'Pc',
    'Assimilator': 'As',
    'Nexus': 'Nx',
    'RoboticsFacility': 'Rb',
    'Stargate': 'Sg',
    'TwilightCouncil': 'Tw',
    'TemplarArchive': 'Ta',
    'DarkShrine': 'Ds',
    'RoboticsBay': 'Ry',
    'FleetBeacon': 'Fb',
    'ShieldBattery': 'Sb',

    // Terran
    'CommandCenter': 'Cc',
    'Barracks': 'Rax',
    'Factory': 'Fac',
    'Starport': 'Sp',
    'SupplyDepot': 'Sd',
    'Refinery': 'Ref',
    'EngineeringBay': 'Eb',
    'MissileTurret': 'Mt',
    'Bunker': 'Bk',
    'Armory': 'Arm',
    'FusionCore': 'Fc',

    // Zerg
    'Hatchery': 'Ha',
    'Extractor': 'Ex',
    'SpawningPool': 'Pl',
    'EvolutionChamber': 'Ev',
    'RoachWarren': 'Rw',
    'BanelingNest': 'Bn',
    'SpineCrawler': 'Sc',
    'SporeCrawler': 'Sr',
    'Lair': 'La',
    'HydraliskDen': 'Hd',
    'LurkerDen': 'Ld',
    'InfestationPit': 'Ip',
    'Spire': 'Sp',
    'NydusNetwork': 'Nn',
    'UltraliskCavern': 'Uc',
    'Hive': 'Hi',
    'GreaterSpire': 'Gs',
  };

  if (abbreviations[unitName]) {
    return abbreviations[unitName];
  }

  // Default: take first 2 characters
  return unitName.slice(0, 2);
}

// Utility function to abbreviate upgrade names
export function abbreviateUpgradeName(upgradeName: string): string {
  const abbreviations: Record<string, string> = {
    // Protoss
    'WarpGateResearch': 'WG',
    'Charge': 'Ch',
    'Blink': 'Bl',
    'ProtossGroundWeaponsLevel1': '+1A',
    'ProtossGroundWeaponsLevel2': '+2A',
    'ProtossGroundWeaponsLevel3': '+3A',
    'ProtossGroundArmorsLevel1': '+1D',
    'ProtossGroundArmorsLevel2': '+2D',
    'ProtossGroundArmorsLevel3': '+3D',
    'ProtossShieldsLevel1': '+1S',
    'ProtossShieldsLevel2': '+2S',
    'ProtossShieldsLevel3': '+3S',
    'ProtossAirWeaponsLevel1': '+1R',
    'ProtossAirWeaponsLevel2': '+2R',
    'ProtossAirWeaponsLevel3': '+3R',
    'ProtossAirArmorsLevel1': '+1D',
    'ProtossAirArmorsLevel2': '+2D',
    'ProtossAirArmorsLevel3': '+3D',

    // Terran
    'TerranInfantryWeaponsLevel1': '+1A',
    'TerranInfantryWeaponsLevel2': '+2A',
    'TerranInfantryWeaponsLevel3': '+3A',
    'TerranInfantryArmorsLevel1': '+1D',
    'TerranInfantryArmorsLevel2': '+2D',
    'TerranInfantryArmorsLevel3': '+3D',
    'TerranVehicleWeaponsLevel1': '+1A',
    'TerranVehicleWeaponsLevel2': '+2A',
    'TerranVehicleWeaponsLevel3': '+3A',
    'TerranVehicleArmorsLevel1': '+1D',
    'TerranVehicleArmorsLevel2': '+2D',
    'TerranVehicleArmorsLevel3': '+3D',
    'TerranShipWeaponsLevel1': '+1R',
    'TerranShipWeaponsLevel2': '+2R',
    'TerranShipWeaponsLevel3': '+3R',
    'TerranShipArmorsLevel1': '+1D',
    'TerranShipArmorsLevel2': '+2D',
    'TerranShipArmorsLevel3': '+3D',

    // Zerg
    'ZergMeleeWeaponsLevel1': '+1A',
    'ZergMeleeWeaponsLevel2': '+2A',
    'ZergMeleeWeaponsLevel3': '+3A',
    'ZergMissileWeaponsLevel1': '+1R',
    'ZergMissileWeaponsLevel2': '+2R',
    'ZergMissileWeaponsLevel3': '+3R',
    'ZergGroundArmorsLevel1': '+1D',
    'ZergGroundArmorsLevel2': '+2D',
    'ZergGroundArmorsLevel3': '+3D',
    'ZergFlyerWeaponsLevel1': '+1R',
    'ZergFlyerWeaponsLevel2': '+2R',
    'ZergFlyerWeaponsLevel3': '+3R',
    'ZergFlyerArmorsLevel1': '+1D',
    'ZergFlyerArmorsLevel2': '+2D',
    'ZergFlyerArmorsLevel3': '+3D',
  };

  if (abbreviations[upgradeName]) {
    return abbreviations[upgradeName];
  }

  // Default: take first 3 characters
  return upgradeName.slice(0, 3);
}
