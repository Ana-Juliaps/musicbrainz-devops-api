import { isValidMbid, parseLimit, parseQuery } from '../src/validation';

describe('validation', () => {
  it('aceita um MBID válido', () => {
    expect(isValidMbid('5b11f4ce-a62d-471e-81fc-a69a8278c7da')).toBe(true);
  });

  it('rejeita MBID inválido', () => {
    expect(isValidMbid('nao-e-um-uuid')).toBe(false);
    expect(isValidMbid('')).toBe(false);
  });

  it('usa limite padrão quando ausente e rejeita valores fora da faixa', () => {
    expect(parseLimit(undefined)).toBe(10);
    expect(parseLimit('5')).toBe(5);
    expect(parseLimit('0')).toBeNull();
    expect(parseLimit('26')).toBeNull();
    expect(parseLimit('abc')).toBeNull();
  });

  it('valida o termo de busca', () => {
    expect(parseQuery('  Nirvana ')).toBe('Nirvana');
    expect(parseQuery('')).toBeNull();
    expect(parseQuery(undefined)).toBeNull();
    expect(parseQuery('a'.repeat(201))).toBeNull();
  });
});
