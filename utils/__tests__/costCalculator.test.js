import { describe, it, expect } from 'vitest';
import {
  calculateEC2Cost,
  calculateRDSCost,
  calculateLambdaCost,
  calculateS3Cost,
  calculateServiceCost,
  calculateTotalCost,
  applyPricingModel,
} from '../costCalculator';

describe('Cost Calculator', () => {
  describe('applyPricingModel', () => {
    it('should apply no discount for on-demand pricing', () => {
      expect(applyPricingModel(100, 'on-demand')).toBe(100);
    });

    it('should apply 30% discount for reserved-1yr pricing', () => {
      expect(applyPricingModel(100, 'reserved-1yr')).toBe(70);
    });

    it('should apply 50% discount for reserved-3yr pricing', () => {
      expect(applyPricingModel(100, 'reserved-3yr')).toBe(50);
    });

    it('should apply 70% discount for spot pricing', () => {
      expect(applyPricingModel(100, 'spot')).toBe(30);
    });
  });

  describe('calculateEC2Cost', () => {
    it('should calculate cost for t2.micro instance', () => {
      const cost = calculateEC2Cost({ instanceType: 't2.micro' }, 'us-east-1', 'on-demand');
      expect(cost).toBeGreaterThan(0);
    });

    it('should calculate cost for t2.small instance', () => {
      const cost = calculateEC2Cost({ instanceType: 't2.small' }, 'us-east-1', 'on-demand');
      expect(cost).toBeGreaterThan(0);
    });
  });

  describe('calculateRDSCost', () => {
    it('should calculate cost for MySQL instance', () => {
      const cost = calculateRDSCost({ engine: 'mysql', instanceType: 'db.t3.micro' }, 'us-east-1', 'on-demand');
      expect(cost).toBeGreaterThan(0);
    });

    it('should calculate cost for PostgreSQL instance', () => {
      const cost = calculateRDSCost({ engine: 'postgresql', instanceType: 'db.t3.micro' }, 'us-east-1', 'on-demand');
      expect(cost).toBeGreaterThan(0);
    });
  });

  describe('calculateLambdaCost', () => {
    it('should calculate cost based on executions and memory', () => {
      const cost = calculateLambdaCost({ executions: 1000000, memory: 128 }, 'us-east-1', 'on-demand');
      expect(cost).toBeGreaterThan(0);
    });

    it('should calculate higher cost for more memory', () => {
      const cost256 = calculateLambdaCost({ executions: 1000000, memory: 256 }, 'us-east-1', 'on-demand');
      const cost128 = calculateLambdaCost({ executions: 1000000, memory: 128 }, 'us-east-1', 'on-demand');
      expect(cost256).toBeGreaterThan(cost128);
    });
  });

  describe('calculateS3Cost', () => {
    it('should calculate storage cost', () => {
      const cost = calculateS3Cost({ storage: 100 }, 'us-east-1', 'on-demand');
      expect(cost).toBeGreaterThan(0);
    });

    it('should calculate higher cost for more storage', () => {
      const cost1000 = calculateS3Cost({ storage: 1000 }, 'us-east-1', 'on-demand');
      const cost100 = calculateS3Cost({ storage: 100 }, 'us-east-1', 'on-demand');
      expect(cost1000).toBeGreaterThan(cost100);
    });
  });

  describe('calculateServiceCost', () => {
    it('should calculate cost for EC2 service', () => {
      const node = {
        data: {
          service: 'ec2',
          config: { instanceType: 't2.micro' }
        }
      };
      const cost = calculateServiceCost(node, 'us-east-1', 'on-demand');
      expect(cost).toBeGreaterThan(0);
    });

    it('should return 0 for unknown service', () => {
      const node = {
        data: {
          service: 'unknown-service',
          config: {}
        }
      };
      const cost = calculateServiceCost(node, 'us-east-1', 'on-demand');
      expect(cost).toBe(0);
    });
  });

  describe('calculateTotalCost', () => {
    it('should calculate total cost for multiple nodes', () => {
      const nodes = [
        {
          data: {
            service: 'ec2',
            config: { instanceType: 't2.micro' }
          }
        },
        {
          data: {
            service: 's3',
            config: { storage: 100 }
          }
        }
      ];
      const total = calculateTotalCost(nodes, 'us-east-1', 'on-demand');
      expect(total).toBeGreaterThan(0);
    });

    it('should return 0 for empty nodes array', () => {
      const total = calculateTotalCost([], 'us-east-1', 'on-demand');
      expect(total).toBe(0);
    });
  });
});
