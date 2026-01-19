import GraveyardClient from '@/components/GraveyardClient';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      {/* Header */}
      <header className="bg-orange-500 py-12 px-5 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Crowdfunding Physical Product Graveyard</h1>
        <p className="text-white/90 text-lg">Explore 41 crowdfunded hardware projects that raised $122.5M and left backers empty-handed. Filter by product development issue to find out why.</p>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <GraveyardClient />
      </main>

      {/* Footer */}
      <Footer positioning="relative" />
    </div>
  );
}
