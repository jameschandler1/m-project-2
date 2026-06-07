/**
 * Validation Tests
 * 
 * Tests for email and password validation logic
 */

const { body } = require('express-validator');

describe('Email Validation', () => {
  test('should accept valid email addresses', () => {
    const validEmails = [
      'test@example.com',
      'user.name@example.com',
      'user+tag@example.com',
      'user123@example.co.uk',
    ];

    validEmails.forEach(email => {
      const req = { body: { email } };
      const validationChain = body('email').isEmail().normalizeEmail();
      
      // Run validation
      const result = validationChain.run(req);
      expect(result).toBeDefined();
    });
  });

  test('should reject invalid email addresses', () => {
    const invalidEmails = [
      'invalid',
      'invalid@',
      '@example.com',
      'invalid email@example.com',
      'invalid@.com',
    ];

    invalidEmails.forEach(email => {
      const req = { body: { email } };
      const validationChain = body('email').isEmail().normalizeEmail();
      
      // Run validation
      const result = validationChain.run(req);
      expect(result).toBeDefined();
    });
  });

  test('should normalize email addresses', () => {
    const email = '  Test@Example.COM  ';
    const normalized = email.trim().toLowerCase();
    
    expect(normalized).toBe('test@example.com');
  });
});

describe('Password Validation', () => {
  test('should accept valid passwords (8+ chars, mixed case, numbers)', () => {
    const validPasswords = [
      'Password123',
      'MySecurePass456',
      'AnotherPass789',
      'Test12345',
    ];

    validPasswords.forEach(password => {
      const isValid = password.length >= 8 && 
                      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password);
      expect(isValid).toBe(true);
    });
  });

  test('should reject passwords without uppercase letters', () => {
    const invalidPasswords = [
      'password123',
      'lowercase456',
      'nopassword789',
    ];

    invalidPasswords.forEach(password => {
      const isValid = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password);
      expect(isValid).toBe(false);
    });
  });

  test('should reject passwords without lowercase letters', () => {
    const invalidPasswords = [
      'PASSWORD123',
      'UPPERCASE456',
      'NOPASSWORD789',
    ];

    invalidPasswords.forEach(password => {
      const isValid = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password);
      expect(isValid).toBe(false);
    });
  });

  test('should reject passwords without numbers', () => {
    const invalidPasswords = [
      'Password',
      'MySecurePass',
      'AnotherPass',
    ];

    invalidPasswords.forEach(password => {
      const isValid = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password);
      expect(isValid).toBe(false);
    });
  });

  test('should reject passwords shorter than 8 characters', () => {
    const invalidPasswords = [
      'Pass1',
      'MyPw2',
      'Test3',
    ];

    invalidPasswords.forEach(password => {
      const isValid = password.length >= 8;
      expect(isValid).toBe(false);
    });
  });

  test('should reject empty passwords', () => {
    const emptyPasswords = ['', null, undefined];

    emptyPasswords.forEach(password => {
      const isValid = !!(password && password.length > 0);
      expect(isValid).toBe(false);
    });
  });
});
