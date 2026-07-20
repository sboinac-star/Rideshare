export const locations = [
  "Atlanta", "Austin", "Bella Vista", "Bentonville", "Boston",
  "Canehill", "Charlotte", "Chicago", "Dallas", "Decatur",
  "Denver", "Elkins", "Eureka Springs", "Farmington", "Fayetteville",
  "Gentry", "Gravette", "Greenland", "Houston", "Huntsville",
  "Johnson", "Kansas City", "Las Vegas", "Lincoln", "Little Rock",
  "Los Angeles", "Maysville", "Memphis", "Miami", "Nashville",
  "New Orleans", "New York", "Oklahoma City", "Phoenix", "Prairie Grove",
  "Rogers", "San Francisco", "Seattle", "Siloam Springs", "Springdale",
  "St. Louis", "Tulsa", "Washington DC", "West Fork",
];

// Featured community event — shows a banner on home + quick-pick in post forms
// until the end date passes. Update or replace for the next event.
export const featuredEvent = {
  name: "NWATA Bonalu & Vana Bojanam",
  shortName: "Bonalu Celebrations",
  emoji: "🪔",
  venue: "Benton County Fairgrounds",
  city: "Bentonville",
  dateLabel: "Sun, Jul 26 · 10am–4pm",
  // Banner hides after this date (end of event day, local time)
  endsAt: "2026-07-26T23:59:59",
};

export function isFeaturedEventActive(): boolean {
  return new Date() <= new Date(featuredEvent.endsAt);
}
