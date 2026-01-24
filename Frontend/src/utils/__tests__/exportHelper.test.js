import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  validateArchitecture,
  encodeArchitectureToUrl,
  decodeArchitectureFromUrl,
} from '../exportHelper';

describe('Export Helper', () => {
  describe('validateArchitecture', () => {
    it('should return no errors for valid architecture', () => {
      const architecture = {
        version: '1.0',
        nodes: [],
        edges: [],
        region: 'us-east-1',
        pricingModel: 'on-demand',
      };

      const errors = validateArchitecture(architecture);
      expect(errors).toHaveLength(0);
    });

    it('should detect missing version', () => {
      const architecture = {
        nodes: [],
        edges: [],
        region: 'us-east-1',
        pricingModel: 'on-demand',
      };

      const errors = validateArchitecture(architecture);
      expect(errors).toContain('Missing version field');
    });

    it('should detect invalid nodes type', () => {
      const architecture = {
        version: '1.0',
        nodes: 'invalid',
        edges: [],
        region: 'us-east-1',
        pricingModel: 'on-demand',
      };

      const errors = validateArchitecture(architecture);
      expect(errors).toContain('Nodes must be an array');
    });

    it('should detect missing region', () => {
      const architecture = {
        version: '1.0',
        nodes: [],
        edges: [],
        pricingModel: 'on-demand',
      };

      const errors = validateArchitecture(architecture);
      expect(errors).toContain('Missing region field');
    });

    it('should return error for null architecture', () => {
      const errors = validateArchitecture(null);
      expect(errors).toContain('Architecture is null or undefined');
    });
  });

  describe('encodeArchitectureToUrl', () => {
    beforeEach(() => {
      // Mock window.location
      global.window = {
        location: {
          origin: 'http://localhost:5174',
          pathname: '/',
        },
      };
    });

    it('should encode architecture to URL', () => {
      const architecture = {
        version: '1.0',
        nodes: [{ id: '1', data: { label: 'EC2' } }],
        edges: [],
        region: 'us-east-1',
        pricingModel: 'on-demand',
      };

      const url = encodeArchitectureToUrl(architecture);
      expect(url).toContain('http://localhost:5174');
      expect(url).toContain('?arch=');
    });

    it('should create valid base64 encoded URL', () => {
      const architecture = {
        version: '1.0',
        nodes: [],
        edges: [],
        region: 'us-west-2',
        pricingModel: 'reserved-1yr',
      };

      const url = encodeArchitectureToUrl(architecture);
      const params = new URLSearchParams(url.split('?')[1]);
      const encoded = params.get('arch');
      
      expect(encoded).toBeTruthy();
      expect(typeof encoded).toBe('string');
    });

    it('should handle complex architectures', () => {
      const architecture = {
        version: '1.0',
        nodes: [
          { id: '1', data: { label: 'EC2', instanceType: 't3.medium' } },
          { id: '2', data: { label: 'RDS', storage: 100 } },
        ],
        edges: [{ source: '1', target: '2' }],
        region: 'eu-west-1',
        pricingModel: 'spot',
      };

      const url = encodeArchitectureToUrl(architecture);
      expect(url).toBeTruthy();
      expect(url).toContain('?arch=');
    });
  });

  describe('URL encoding/decoding integration', () => {
    beforeEach(() => {
      global.window = {
        location: {
          origin: 'http://localhost:5174',
          pathname: '/',
          search: '',
        },
      };
    });

    it('should encode and decode architecture correctly', () => {
      const original = {
        version: '1.0',
        nodes: [
          { id: '1', data: { label: 'EC2', instanceType: 't3.small' } },
        ],
        edges: [],
        region: 'us-east-1',
        pricingModel: 'on-demand',
      };

      const url = encodeArchitectureToUrl(original);
      const params = new URLSearchParams(url.split('?')[1]);
      const arch = params.get('arch');

      // Mock window.location.search for decode
      global.window.location.search = `?arch=${arch}`;

      const decoded = decodeArchitectureFromUrl();
      
      expect(decoded).not.toBeNull();
      expect(decoded.version).toBe(original.version);
      expect(decoded.region).toBe(original.region);
      expect(decoded.pricingModel).toBe(original.pricingModel);
      expect(decoded.nodes).toHaveLength(1);
    });

    it('should return null when no arch parameter', () => {
      global.window.location.search = '';
      const result = decodeArchitectureFromUrl();
      expect(result).toBeNull();
    });

    it('should return null for invalid base64', () => {
      global.window.location.search = '?arch=invalid!!!';
      const result = decodeArchitectureFromUrl();
      expect(result).toBeNull();
    });
  });
});
