import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "NWA Resources — NWA Ride Share",
  description: "Useful links for Northwest Arkansas residents and visitors — DMV, transit, airport, parking, and more.",
  openGraph: {
    title: "NWA Resources — NWA Ride Share",
    description: "Useful links for Northwest Arkansas residents and visitors.",
    url: "/resources/",
  },
};

interface LinkItem {
  label: string;
  url: string;
  description: string;
}

interface Category {
  emoji: string;
  title: string;
  links: LinkItem[];
}

const categories: Category[] = [
  {
    emoji: "🪪",
    title: "Driver's License & Vehicle",
    links: [
      {
        label: "Arkansas DMV — Online Services",
        url: "https://www.dfa.arkansas.gov/motor-vehicle/",
        description: "Renew your license, update your address, pay fines, and more online.",
      },
      {
        label: "Fayetteville Revenue Office",
        url: "https://www.dfa.arkansas.gov/about/locations/?county=Washington",
        description: "Washington County DMV locations, hours, and services.",
      },
      {
        label: "Benton County Revenue Office",
        url: "https://www.dfa.arkansas.gov/about/locations/?county=Benton",
        description: "Benton County DMV locations, hours, and services.",
      },
      {
        label: "AR Real ID Info",
        url: "https://www.dfa.arkansas.gov/motor-vehicle/driver-services/real-id/",
        description: "What you need to get a REAL ID-compliant Arkansas driver's license.",
      },
    ],
  },
  {
    emoji: "✈️",
    title: "Airport",
    links: [
      {
        label: "XNA — Northwest Arkansas National Airport",
        url: "https://www.flyxna.com/",
        description: "Flight schedules, parking, terminal maps, and ground transportation at XNA.",
      },
      {
        label: "XNA Parking & Transportation",
        url: "https://www.flyxna.com/parking-transportation/",
        description: "Parking rates, rental cars, shuttles, and rideshare pickup zones.",
      },
      {
        label: "XNA Flight Status",
        url: "https://www.flyxna.com/flights/",
        description: "Check real-time arrivals and departures.",
      },
    ],
  },
  {
    emoji: "🚌",
    title: "Public Transit",
    links: [
      {
        label: "Ozark Regional Transit (ORT)",
        url: "https://www.ozarkregionaltransit.org/",
        description: "Bus routes connecting Fayetteville, Springdale, Rogers, and Bentonville.",
      },
      {
        label: "ORT Route Map & Schedules",
        url: "https://www.ozarkregionaltransit.org/routes-schedules",
        description: "Download or view route maps and timetables.",
      },
      {
        label: "Razorback Transit (UA Fayetteville)",
        url: "https://razorbacktransit.com/",
        description: "Free University of Arkansas bus service — open to the public on some routes.",
      },
    ],
  },
  {
    emoji: "🅿️",
    title: "Parking",
    links: [
      {
        label: "Fayetteville Parking Services",
        url: "https://www.fayetteville-ar.gov/2190/Parking-Services",
        description: "Downtown Fayetteville garages, meters, permits, and pay-by-phone.",
      },
      {
        label: "Bentonville Parking",
        url: "https://www.bentonvillear.com/636/Parking",
        description: "Parking options in downtown Bentonville near Crystal Bridges and the square.",
      },
      {
        label: "Rogers Parking",
        url: "https://www.rogersar.gov/",
        description: "City of Rogers downtown and event parking information.",
      },
    ],
  },
  {
    emoji: "🚲",
    title: "Cycling & Trails",
    links: [
      {
        label: "Phat Tire Bike Shop Trail Map",
        url: "https://www.phattirebikeshop.com/pages/trail-maps",
        description: "Unofficial but beloved NWA trail guide from a local shop.",
      },
      {
        label: "NWA Trail Blazers",
        url: "https://nwatrailblazers.org/",
        description: "Volunteer trail-building org with an interactive trail map for the region.",
      },
      {
        label: "Razorback Greenway",
        url: "https://razorbackgreenway.org/",
        description: "36-mile paved trail connecting Fayetteville, Springdale, Rogers, and Bentonville.",
      },
    ],
  },
  {
    emoji: "🌐",
    title: "Community & Newcomers",
    links: [
      {
        label: "Visit NWA",
        url: "https://www.visitnwa.com/",
        description: "Official tourism site — events, food, lodging, and things to do in NWA.",
      },
      {
        label: "NWA Democrat-Gazette",
        url: "https://www.nwaonline.com/",
        description: "Regional news and local events calendar.",
      },
      {
        label: "Northwest Arkansas Council",
        url: "https://nwacouncil.org/",
        description: "Regional planning and community resources for NWA.",
      },
    ],
  },
];

export default function ResourcesPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">NWA Resources</h1>
        <p className="text-gray-600 mb-10">
          Helpful links for getting around and settling into Northwest Arkansas — from DMV services to transit, trails, and community info.
        </p>

        <div className="space-y-8">
          {categories.map(({ emoji, title, links }) => (
            <section key={title}>
              <h2 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span>{emoji}</span>
                {title}
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {links.map(({ label, url, description }) => (
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md hover:border-blue-200 transition group"
                  >
                    <div className="font-semibold text-blue-700 group-hover:text-blue-800 text-sm mb-1">
                      {label} ↗
                    </div>
                    <div className="text-gray-500 text-xs leading-relaxed">{description}</div>
                  </a>
                ))}
              </div>
            </section>
          ))}
        </div>

        <p className="mt-12 text-center text-gray-400 text-xs">
          Know a resource we&apos;re missing? Use the 💬 Feedback button to suggest it.
        </p>
      </div>
    </div>
  );
}
