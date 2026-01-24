import { describe, it, expect } from 'vitest';
import {
  checkEC2WithoutLoadBalancer,
  checkSinglePointOfFailure,
  checkUnoptimizedInstances,
  checkMissingReservedInstances,
  checkUnusedResources,
  analyzeArchitecture,
  calculateTotalPotentialSavings,
  OptimizationSeverity,
} from '../optimizationEngine';

describe('Optimization Engine', () => {
  describe('checkEC2WithoutLoadBalancer', () => {
    it('should detect EC2 without load balancer', () => {
      const nodes = [
        { id: '1', data: { label: 'EC2' } },
        { id: '2', data: { label: 'S3' } },
      ];
      const edges = [];

      const result = checkEC2WithoutLoadBalancer(nodes, edges);
      expect(result).not.toBeNull();
      expect(result.severity).toBe(OptimizationSeverity.CRITICAL);
      expect(result.impactedResources).toContain('1');
    });

    it('should not flag EC2 with ALB', () => {
      const nodes = [
        { id: '1', data: { label: 'EC2' } },
        { id: '2', data: { label: 'ALB' } },
      ];
      const edges = [{ source: '2', target: '1' }];

      const result = checkEC2WithoutLoadBalancer(nodes, edges);
      expect(result).toBeNull();
    });

    it('should return null when no EC2 instances', () => {
      const nodes = [{ id: '1', data: { label: 'S3' } }];
      const edges = [];

      const result = checkEC2WithoutLoadBalancer(nodes, edges);
      expect(result).toBeNull();
    });
  });

  describe('checkSinglePointOfFailure', () => {
    it('should detect single instance services', () => {
      const nodes = [
        { id: '1', data: { label: 'EC2', quantity: 1 } },
        { id: '2', data: { label: 'RDS', quantity: 1 } },
      ];
      const edges = [];

      const result = checkSinglePointOfFailure(nodes, edges);
      expect(result).not.toBeNull();
      expect(result.severity).toBe(OptimizationSeverity.CRITICAL);
      expect(result.impactedResources).toHaveLength(2);
    });

    it('should not flag multi-instance deployments', () => {
      const nodes = [
        { id: '1', data: { label: 'EC2', quantity: 2 } },
      ];
      const edges = [];

      const result = checkSinglePointOfFailure(nodes, edges);
      expect(result).toBeNull();
    });
  });

  describe('checkUnoptimizedInstances', () => {
    it('should detect large instance types', () => {
      const nodes = [
        { id: '1', data: { label: 'EC2', instanceType: 'c5.4xlarge' } },
        { id: '2', data: { label: 'RDS', instanceType: 'db.r5.xlarge' } },
      ];

      const result = checkUnoptimizedInstances(nodes);
      expect(result).not.toBeNull();
      expect(result.severity).toBe(OptimizationSeverity.WARNING);
      expect(result.estimatedSavings).toBeGreaterThan(0);
    });

    it('should not flag small instances', () => {
      const nodes = [
        { id: '1', data: { label: 'EC2', instanceType: 't3.small' } },
      ];

      const result = checkUnoptimizedInstances(nodes);
      expect(result).toBeNull();
    });
  });

  describe('checkMissingReservedInstances', () => {
    it('should suggest reserved instances for compute services', () => {
      const nodes = [
        { id: '1', data: { label: 'EC2' } },
        { id: '2', data: { label: 'RDS' } },
        { id: '3', data: { label: 'Redshift' } },
      ];

      const result = checkMissingReservedInstances(nodes);
      expect(result).not.toBeNull();
      expect(result.severity).toBe(OptimizationSeverity.WARNING);
      expect(result.estimatedSavings).toBeGreaterThan(0);
    });

    it('should return null when no compute services', () => {
      const nodes = [
        { id: '1', data: { label: 'S3' } },
        { id: '2', data: { label: 'Lambda' } },
      ];

      const result = checkMissingReservedInstances(nodes);
      expect(result).toBeNull();
    });
  });

  describe('checkUnusedResources', () => {
    it('should detect orphan nodes', () => {
      const nodes = [
        { id: '1', data: { label: 'EC2' } },
        { id: '2', data: { label: 'S3' } },
        { id: '3', data: { label: 'RDS' } },
      ];
      const edges = [{ source: '1', target: '2' }];

      const result = checkUnusedResources(nodes, edges);
      expect(result).not.toBeNull();
      expect(result.impactedResources).toContain('3');
      expect(result.estimatedSavings).toBeGreaterThan(0);
    });

    it('should return null when all nodes are connected', () => {
      const nodes = [
        { id: '1', data: { label: 'EC2' } },
        { id: '2', data: { label: 'S3' } },
      ];
      const edges = [{ source: '1', target: '2' }];

      const result = checkUnusedResources(nodes, edges);
      expect(result).toBeNull();
    });
  });

  describe('analyzeArchitecture', () => {
    it('should return all applicable suggestions', () => {
      const nodes = [
        { id: '1', data: { label: 'EC2', quantity: 1 } },
        { id: '2', data: { label: 'S3' } },
      ];
      const edges = [];

      const suggestions = analyzeArchitecture(nodes, edges);
      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeGreaterThan(0);
    });

    it('should sort by severity', () => {
      const nodes = [
        { id: '1', data: { label: 'EC2', quantity: 1, instanceType: 'c5.4xlarge' } },
      ];
      const edges = [];

      const suggestions = analyzeArchitecture(nodes, edges);
      const severities = suggestions.map(s => s.severity);
      
      // Critical should come before Warning
      const criticalIndex = severities.indexOf(OptimizationSeverity.CRITICAL);
      const warningIndex = severities.indexOf(OptimizationSeverity.WARNING);
      
      if (criticalIndex !== -1 && warningIndex !== -1) {
        expect(criticalIndex).toBeLessThan(warningIndex);
      }
    });

    it('should return empty array for optimized architecture', () => {
      const nodes = [];
      const edges = [];

      const suggestions = analyzeArchitecture(nodes, edges);
      expect(suggestions).toHaveLength(0);
    });
  });

  describe('calculateTotalPotentialSavings', () => {
    it('should sum all estimated savings', () => {
      const suggestions = [
        { estimatedSavings: 100 },
        { estimatedSavings: 50 },
        { estimatedSavings: 25 },
      ];

      const total = calculateTotalPotentialSavings(suggestions);
      expect(total).toBe(175);
    });

    it('should handle zero savings', () => {
      const suggestions = [
        { estimatedSavings: 0 },
      ];

      const total = calculateTotalPotentialSavings(suggestions);
      expect(total).toBe(0);
    });

    it('should handle empty array', () => {
      const total = calculateTotalPotentialSavings([]);
      expect(total).toBe(0);
    });
  });
});
