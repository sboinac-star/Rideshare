import Link from "next/link";

export const metadata = {
  title: "About — NWA Ride Share",
  description: "How NWA Ride Share works for drivers and passengers in Northwest Arkansas.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">About NWA Ride Share</h1>
        <p className="text-gray-600 mb-10">
          A free, community-run carpooling board for Northwest Arkansas and beyond. No accounts, no fees — just connect directly with drivers and passengers.
        </p>

        <div className="grid md:grid-cols-2 gap-6 mb-10">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl mb-3">🚗</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">For Drivers</h2>
            <ol className="space-y-2 text-gray-700 text-sm list-decimal list-inside">
              <li>Go to <strong>Post Journey</strong> in the nav.</li>
              <li>Fill in your route, departure time, available seats, and phone number.</li>
              <li>Your listing goes live instantly — passengers contact you directly.</li>
              <li>Negotiate price and pickup details over call or WhatsApp.</li>
              <li>Edit your departure time or seat count anytime, or cancel if plans change.</li>
            </ol>
            <Link href="/driver" className="mt-4 inline-block bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-2 px-4 rounded-lg transition">
              Post a Journey →
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl mb-3">🙋</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">For Passengers</h2>
            <ol className="space-y-2 text-gray-700 text-sm list-decimal list-inside">
              <li>Browse <strong>Available Rides</strong> on the home page and filter by city or date.</li>
              <li>If no ride fits, switch to <strong>Ride Requests</strong> or post your own request.</li>
              <li>Contact the driver directly via call or WhatsApp.</li>
              <li>Agree on price, pickup spot, and timing — all handled between you two.</li>
            </ol>
            <Link href="/passenger" className="mt-4 inline-block bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold py-2 px-4 rounded-lg transition">
              Request a Ride →
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
          <div className="space-y-5">
            {faqs.map(({ q, a }) => (
              <div key={q}>
                <p className="font-semibold text-gray-900 mb-1">{q}</p>
                <p className="text-gray-600 text-sm">{a}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-5 mb-8">
          <h2 className="font-bold text-amber-900 mb-2">Safety Tips</h2>
          <ul className="text-amber-800 text-sm space-y-1 list-disc list-inside">
            <li>Share your travel plans with someone you trust before the ride.</li>
            <li>Meet in a public place for pickup when possible.</li>
            <li>Trust your instincts — you can decline any ride for any reason.</li>
            <li>Verify the driver&apos;s phone number before getting in the car.</li>
          </ul>
        </div>

        <p className="text-center text-gray-500 text-sm">
          See a problem?{" "}
          <Link href="/" className="text-blue-600 hover:underline">
            Report a listing
          </Link>{" "}
          using the 🚩 flag on any ride card.
        </p>
      </div>
    </div>
  );
}

const faqs = [
  {
    q: "Is this free to use?",
    a: "Yes, completely free. This is a community board — we don't charge drivers or passengers anything.",
  },
  {
    q: "Do I need an account?",
    a: "No. Anyone can browse rides and post journeys or requests without signing up.",
  },
  {
    q: "How is pricing decided?",
    a: "Price is negotiated directly between the driver and passenger. A common approach is splitting fuel costs.",
  },
  {
    q: "What if no one contacts me after I post?",
    a: "Use the Share button on your listing to copy a message you can post in WhatsApp groups, Facebook, or anywhere your community hangs out.",
  },
  {
    q: "Can I edit or cancel my listing?",
    a: "Yes. Go back to the Post Journey or Request Ride page to see your listings and edit the time, seats, or cancel.",
  },
  {
    q: "Is this only for NWA?",
    a: "NWA is the focus, but the board is open to any route — including one-way intercity trips across the US.",
  },
];
