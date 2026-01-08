'use client';

import { useState, useEffect, useMemo } from 'react';
import { Project } from '@/types/project';

type SortField = 'amount' | 'date' | 'backers';

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return Math.floor(num / 1000) + 'K';
  }
  return num.toLocaleString();
}

function formatCurrency(num: number): string {
  return '$' + num.toLocaleString();
}

function getSourceName(url: string): string {
  const domainMap: Record<string, string> = {
    'kickstarter.com': 'Kickstarter',
    'indiegogo.com': 'Indiegogo',
    'wikipedia.org': 'Wikipedia',
    'en.wikipedia.org': 'Wikipedia',
    'techcrunch.com': 'TechCrunch',
    'theverge.com': 'The Verge',
    'engadget.com': 'Engadget',
    'gizmodo.com': 'Gizmodo',
    'wired.com': 'Wired',
    'medium.com': 'Medium',
    'reddit.com': 'Reddit',
    'youtube.com': 'YouTube',
    'twitter.com': 'Twitter',
    'failory.com': 'Failory',
    'backerkit.com': 'BackerKit',
    'kicktraq.com': 'Kicktraq',
    'ftc.gov': 'FTC',
    'hackaday.com': 'Hackaday',
    'thespoon.tech': 'The Spoon',
    'crowdfundinsider.com': 'Crowdfund Insider',
    'androidpolice.com': 'Android Police',
    'slashgear.com': 'SlashGear',
    'geekwire.com': 'GeekWire',
    'washingtonpost.com': 'Washington Post',
    'fortune.com': 'Fortune',
    'boardgamewire.com': 'Board Game Wire',
    'bbb.org': 'BBB',
    'eevblog.com': 'EEVBlog',
    'kguttag.com': 'KGOnTech',
    'gearjunkie.com': 'GearJunkie',
    'stltoday.com': 'St. Louis Today',
    'thedanzing.com': 'The Danzing',
  };

  try {
    const hostname = new URL(url).hostname.replace('www.', '');
    return domainMap[hostname] || hostname.split('.')[0].charAt(0).toUpperCase() + hostname.split('.')[0].slice(1);
  } catch {
    return 'Source';
  }
}

function getTagClass(tag: string): string {
  const tagKey = tag.toLowerCase().replace(/[^a-z]/g, '');
  const tagClasses: Record<string, string> = {
    fraudscam: 'bg-red-50 text-red-600 border border-red-200',
    manufacturingissues: 'bg-orange-50 text-orange-600 border border-orange-200',
    technicallyimpossible: 'bg-purple-50 text-purple-600 border border-purple-200',
    ranoutofmoney: 'bg-yellow-50 text-yellow-600 border border-yellow-200',
    companyshutdown: 'bg-slate-100 text-slate-500 border border-slate-200',
    neverdelivered: 'bg-red-50 text-red-700 border border-red-200',
    partialdelivery: 'bg-amber-50 text-amber-600 border border-amber-200',
    shippingproblems: 'bg-blue-50 text-blue-600 border border-blue-200',
    poorquality: 'bg-fuchsia-50 text-fuchsia-600 border border-fuchsia-200',
    overpromised: 'bg-cyan-50 text-cyan-600 border border-cyan-200',
    projectfailed: 'bg-slate-100 text-slate-600 border border-slate-300',
  };
  return tagClasses[tagKey] || 'bg-gray-100 text-gray-600 border border-gray-200';
}

export default function GraveyardClient() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [currentSort, setCurrentSort] = useState<SortField>('amount');
  const [sortDirection, setSortDirection] = useState(-1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch('/data/graveyard.json');
        if (!response.ok) throw new Error('Failed to load data');
        const data = await response.json();
        setProjects(data);
      } catch (err) {
        setError('Error loading data. Make sure graveyard.json is in the data folder.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const categories = useMemo(() => {
    return [...new Set(projects.map((p) => p.category))].sort();
  }, [projects]);

  const allTags = useMemo(() => {
    return [...new Set(projects.flatMap((p) => p.tags || []))].sort();
  }, [projects]);

  const stats = useMemo(() => {
    const totalLost = projects.reduce((sum, p) => sum + p.amount_raised, 0);
    const totalBackers = projects.reduce((sum, p) => sum + p.backers, 0);
    return { totalProjects: projects.length, totalLost, totalBackers };
  }, [projects]);

  const filteredProjects = useMemo(() => {
    let filtered = projects.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.failure_reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !categoryFilter || p.category === categoryFilter;
      const matchesTag = !tagFilter || (p.tags && p.tags.includes(tagFilter));
      return matchesSearch && matchesCategory && matchesTag;
    });

    filtered.sort((a, b) => {
      let aVal: number | Date, bVal: number | Date;
      switch (currentSort) {
        case 'amount':
          aVal = a.amount_raised;
          bVal = b.amount_raised;
          break;
        case 'date':
          aVal = new Date(a.funded_date);
          bVal = new Date(b.funded_date);
          break;
        case 'backers':
          aVal = a.backers;
          bVal = b.backers;
          break;
      }
      return (aVal > bVal ? 1 : -1) * sortDirection;
    });

    return filtered;
  }, [projects, searchTerm, categoryFilter, tagFilter, currentSort, sortDirection]);

  const handleSort = (sort: SortField) => {
    if (currentSort === sort) {
      setSortDirection((d) => d * -1);
    } else {
      setCurrentSort(sort);
      setSortDirection(-1);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-slate-500 text-lg">Loading projects...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-red-500 text-lg">{error}</div>
      </div>
    );
  }

  return (
    <>
      {/* Stats */}
      <div className="flex justify-center gap-4 sm:gap-8 py-8 px-5 flex-wrap bg-white border-b border-slate-200">
        <div className="text-center px-6 sm:px-10 py-5 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl border border-slate-200">
          <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
            {stats.totalProjects}
          </div>
          <div className="text-slate-500 mt-1 text-xs uppercase tracking-wider font-medium">Failed Projects</div>
        </div>
        <div className="text-center px-6 sm:px-10 py-5 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl border border-slate-200">
          <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
            ${formatNumber(stats.totalLost)}
          </div>
          <div className="text-slate-500 mt-1 text-xs uppercase tracking-wider font-medium">Total Lost</div>
        </div>
        <div className="text-center px-6 sm:px-10 py-5 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl border border-slate-200">
          <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
            {formatNumber(stats.totalBackers)}
          </div>
          <div className="text-slate-500 mt-1 text-xs uppercase tracking-wider font-medium">Backers Affected</div>
        </div>
      </div>

      {/* Controls */}
      <div className="py-5 px-5 flex justify-center gap-4 flex-wrap bg-white border-b border-slate-200">
        <input
          type="text"
          placeholder="Search projects..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-5 py-3 text-base border border-slate-200 rounded-xl bg-slate-50 text-slate-800 w-72 transition-all focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 placeholder:text-slate-400"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-5 py-3 text-base border border-slate-200 rounded-xl bg-slate-50 text-slate-800 cursor-pointer transition-colors focus:outline-none focus:border-orange-500"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
        <select
          value={tagFilter}
          onChange={(e) => setTagFilter(e.target.value)}
          className="px-5 py-3 text-base border border-slate-200 rounded-xl bg-slate-50 text-slate-800 cursor-pointer transition-colors focus:outline-none focus:border-orange-500"
        >
          <option value="">All Failure Types</option>
          {allTags.map((tag) => (
            <option key={tag} value={tag}>
              {tag}
            </option>
          ))}
        </select>
        <button
          onClick={() => handleSort('amount')}
          className={`px-5 py-3 text-sm font-medium border rounded-xl transition-all ${
            currentSort === 'amount'
              ? 'bg-gradient-to-r from-orange-600 to-orange-500 border-transparent text-white'
              : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100 hover:border-slate-300'
          }`}
        >
          Sort by Amount
        </button>
        <button
          onClick={() => handleSort('date')}
          className={`px-5 py-3 text-sm font-medium border rounded-xl transition-all ${
            currentSort === 'date'
              ? 'bg-gradient-to-r from-orange-600 to-orange-500 border-transparent text-white'
              : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100 hover:border-slate-300'
          }`}
        >
          Sort by Date
        </button>
        <button
          onClick={() => handleSort('backers')}
          className={`px-5 py-3 text-sm font-medium border rounded-xl transition-all ${
            currentSort === 'backers'
              ? 'bg-gradient-to-r from-orange-600 to-orange-500 border-transparent text-white'
              : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100 hover:border-slate-300'
          }`}
        >
          Sort by Backers
        </button>
      </div>

      {/* Projects Grid */}
      <div className="max-w-7xl mx-auto px-5 py-8">
        {filteredProjects.length === 0 ? (
          <div className="text-center py-16 text-slate-500 text-xl">No projects found matching your search.</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredProjects.map((project) => (
              <div
                key={project.name}
                className="bg-white rounded-2xl overflow-hidden border border-slate-200 transition-colors hover:border-orange-500"
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-xl font-semibold text-slate-800 flex-1">
                      <a
                        href={project.kickstarter_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-orange-500 transition-colors"
                      >
                        {project.name}
                      </a>
                    </h2>
                    <span className="ml-3 px-3 py-1 text-xs font-medium bg-gradient-to-r from-orange-500/10 to-orange-400/10 text-orange-600 rounded-full whitespace-nowrap">
                      {project.category.split('/').pop()}
                    </span>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {project.tags.map((tag) => (
                      <span
                        key={tag}
                        className={`text-[10px] px-2.5 py-1 rounded font-semibold uppercase tracking-wide ${getTagClass(tag)}`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 mb-4 p-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl">
                    <div className="text-center">
                      <div className="text-lg font-bold text-orange-600">{formatCurrency(project.amount_raised)}</div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wide font-medium">Raised</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-orange-600">{formatNumber(project.backers)}</div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wide font-medium">Backers</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-orange-600">{formatCurrency(project.goal)}</div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wide font-medium">Goal</div>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="flex justify-between text-sm text-slate-500 mb-4 pb-4 border-b border-slate-200">
                    <span>Funded: {project.funded_date}</span>
                    <span>Last Update: {project.last_update}</span>
                  </div>

                  {/* Failure Reason */}
                  <p className="text-sm leading-relaxed text-slate-600">{project.failure_reason}</p>

                  {/* Sources */}
                  <div className="mt-4 pt-4 border-t border-slate-200 flex flex-wrap gap-2">
                    {project.sources.map((src) => (
                      <a
                        key={src}
                        href={src}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-orange-600 px-3 py-1.5 bg-orange-500/10 rounded-md font-medium hover:bg-orange-500/20 transition-colors"
                      >
                        {getSourceName(src)}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
