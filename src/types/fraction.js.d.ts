declare module 'fraction.js' {
  interface Fraction {
    n: number;
    d: number;
    s: number;
    
    abs(): Fraction;
    add(n: Fraction | number | string): Fraction;
    sub(n: Fraction | number | string): Fraction;
    mul(n: Fraction | number | string): Fraction;
    div(n: Fraction | number | string): Fraction;
    pow(n: Fraction | number | string): Fraction;
    mod(n?: Fraction | number | string): Fraction;
    gcd(n: Fraction | number | string): Fraction;
    lcm(n: Fraction | number | string): Fraction;
    
    neg(): Fraction;
    inverse(): Fraction;
    
    round(places?: number): Fraction;
    floor(places?: number): Fraction;
    ceil(places?: number): Fraction;
    
    equals(n: Fraction | number | string): boolean;
    compare(n: Fraction | number | string): -1 | 0 | 1;
    
    toString(): string;
    toFraction(excludeWhole?: boolean): string;
    toLatex(excludeWhole?: boolean): string;
  }
  
  const Fraction: {
    (n: number | string | [number, number]): Fraction;
    new(n: number | string | [number, number]): Fraction;
  };
  
  export default Fraction;
} 