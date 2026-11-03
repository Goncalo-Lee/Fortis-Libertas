import { convertAmount } from "@/lib/exchange";

// Temporary script to try the exchange rate client. Delete it afterwards.
async function main() {
  console.log("1st call (provider, or cache if it already exists):");
  console.log(await convertAmount("100.00", "USD", "EUR", "2026-10-30"));

  console.log("2nd call (cache):");
  console.log(await convertAmount("100.00", "USD", "EUR", "2026-10-30"));

  console.log("Saturday (rate of the previous working day, stored under the requested date):");
  console.log(await convertAmount("100.00", "USD", "EUR", "2026-10-31"));
}

main()
  .catch(console.error)
  .finally(() => process.exit(0));
