import { getLocationIntel } from '../../data/locationIntelligence';

describe('Location Intelligence', () => {
  describe('Known Locations', () => {
    it('should provide detailed intel for Kings Cross', () => {
      const intel = getLocationIntel("Kings Cross");
      expect(intel.description).toContain("Sydney's notorious red-light district");
      expect(intel.riskLevel).toBe(80);
      expect(intel.primaryDrugs).toContain("Cocaine");
    });

    it('should provide detailed intel for Richmond', () => {
      const intel = getLocationIntel("Richmond");
      expect(intel.description).toContain("Melbourne's historical heroin district");
      expect(intel.riskLevel).toBe(65);
      expect(intel.primaryDrugs).toContain("Heroin");
    });
  });

  describe('Generic Locations', () => {
    it('should generate appropriate intel for unknown locations', () => {
      const intel = getLocationIntel("Blacktown");
      expect(intel.description).toContain("typical");
      expect(intel.drugActivity.length).toBeGreaterThan(0);
      expect(intel.crimeAffiliations).toContain("Local dealers");
    });

    it('should generate appropriate intel for hardcore areas', () => {
      const intel = getLocationIntel("Mount Druitt");
      expect(intel.description).toContain("high-risk");
      expect(intel.riskLevel).toBeGreaterThanOrEqual(50);
      expect(intel.primaryDrugs).toContain("Ice");
    });
  });
}); 