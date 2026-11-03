/**
 * Exact decimal arithmetic for money, done on `BigInt` so that no floating point error reaches the amounts.
 * Amounts and rates travel as decimal strings ("1200.50", "1.08123456").
 */

export type DigitInfo = {
  /** Every digit of the number as one integer (sign included): "-12.50" -> -1250n */
  digits: bigint;
  /** How many of those digits are decimal places: "-12.50" -> 2 */
  places: number;
};

const DECIMAL = /^-?\d+(\.\d+)?$/;

/** Splits a decimal string into its digits and decimal places. */
export function parse(value: string): DigitInfo {
  if (!DECIMAL.test(value)) {
    throw new Error(`Invalid decimal: ${value}`);
  }

  if (!value.includes(".")) {
    return { digits: BigInt(value), places: 0 };
  }

  const fraction = value.split(".")[1];
  return { digits: BigInt(value.replace(".", "")), places: fraction.length };
}

/** Formats digits and decimal places back into a decimal string ("-1250n", 2 -> "-12.50"). */
export function format(value: DigitInfo): string {
  const negative = value.digits < 0n;
  const magnitude = (negative ? -value.digits : value.digits).toString();
  const padded = magnitude.padStart(value.places + 1, "0");

  if (value.places === 0) {
    return negative ? `-${padded}` : padded;
  }

  const whole = padded.slice(0, -value.places);
  const fraction = padded.slice(-value.places);
  return `${negative ? "-" : ""}${whole}.${fraction}`;
}

/**
 * Multiplies an amount by a rate and rounds half away from zero to `decimals` places.
 *
 * @example
 * multiplyDecimal("100.00", "1.08125") // "108.13"
 * multiplyDecimal("-100.00", "1.08125") // "-108.13"
 */
export function multiplyDecimal(amount: string, rate: string, decimals = 2): string {
  const a = parse(amount);
  const r = parse(rate);

  const product = a.digits * r.digits;
  const places = a.places + r.places;

  if (places <= decimals) {
    return format({ digits: product * 10n ** BigInt(decimals - places), places: decimals });
  }

  const divisor = 10n ** BigInt(places - decimals);
  const negative = product < 0n;
  const magnitude = negative ? -product : product;

  let quotient = magnitude / divisor;
  if ((magnitude % divisor) * 2n >= divisor) quotient += 1n;

  return format({ digits: negative ? -quotient : quotient, places: decimals });
}

/** Adds two decimal strings, both rounded to `decimals` places first (default 2). */
export function addDecimal(left: string, right: string, decimals = 2): string {
  const l = parse(multiplyDecimal(left, "1", decimals));
  const r = parse(multiplyDecimal(right, "1", decimals));
  return format({ digits: l.digits + r.digits, places: decimals });
}

/** Removes trailing zeros of the fraction: "1.08000000" -> "1.08", "2.00000000" -> "2". */
export function normalizeRate(rate: string): string {
  if (!DECIMAL.test(rate)) {
    throw new Error(`Invalid decimal: ${rate}`);
  }
  if (!rate.includes(".")) return rate;
  return rate.replace(/0+$/, "").replace(/\.$/, "");
}
