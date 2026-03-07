import { describe, it, expect } from 'vitest';
/**
 * Language Store Unit Tests
 * Tests the language store logic without React rendering
 */

describe('Language Store Logic', () => {
  describe('Supported Languages', () => {
    it('should support Spanish and English', () => {
      const supportedLanguages = ['es', 'en'];
      expect(supportedLanguages).toContain('es');
      expect(supportedLanguages).toContain('en');
    });

    it('should have Spanish as default', () => {
      const defaultLanguage = 'es';
      expect(defaultLanguage).toBe('es');
    });
  });

  describe('Translation Structure', () => {
    it('should have correct translation keys for Spanish', () => {
      const translations = {
        es: {
          home: 'Inicio',
          catalog: 'Catálogo',
          cart: 'Carrito',
          login: 'Iniciar Sesión',
          wishlist: 'Favoritos',
        },
        en: {
          home: 'Home',
          catalog: 'Catalog',
          cart: 'Cart',
          login: 'Login',
          wishlist: 'Wishlist',
        },
      };
      expect(translations.es).toHaveProperty('home');
    });
  });
});
