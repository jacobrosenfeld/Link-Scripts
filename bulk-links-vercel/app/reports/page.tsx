"use client";
import { useEffect, useState, useMemo, useCallback } from "react";
import { ProtectedLayout } from "@/components/ProtectedLayout";
import { Header } from "@/components/Header";
import { Label, Input, Button, Select } from "@/components/Field";

interface Link {
  id: number;
  alias: string;
  shorturl: string;
  longurl: string;
  clicks: number;
  uniqueClicks: number;
  title: string;
  description: string;
  date: string;
  campaign: string;
  createdAt: string;
}

interface Campaign {
  id: number;
  name: string;
}

interface Summary {
  totalLinks: number;
  totalClicks: number;
  totalUniqueClicks: number;
  clicksByUrl: Record<string, { title: string; clicks: number; uniqueClicks: number }>;
}

type SortField = 'description' | 'shorturl' | 'longurl' | 'campaign' | 'clicks' | 'createdAt';
type SortDirection = 'asc' | 'desc';

export default function ReportsPage() {
  // Core data states - preload everything in background
  const [allLinks, setAllLinks] = useState<Link[]>([]);
  const [allCampaigns, setAllCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  
  // Filter states
  const [selectedCampaign, setSelectedCampaign] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [minClicks, setMinClicks] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  
  // Display states
  const [showTable, setShowTable] = useState(false);
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Background data loading - fetch everything at once
  useEffect(() => {
    async function loadAllData() {
      try {
        setLoading(true);
        setError("");
        
        // Fetch all data in parallel for speed
        const [linksResponse, campaignsResponse] = await Promise.all([
          fetch('/api/reports?limit=10000'), // Get all links
          fetch('/api/campaigns?limit=1000') // Get all campaigns
        ]);
        
        if (!linksResponse.ok) {
          throw new Error('Failed to fetch links data');
        }
        
        const reportsData = await linksResponse.json();
        setAllLinks(reportsData.links || []);
        
        // Handle campaigns response
        if (campaignsResponse.ok) {
          const campaignsData = await campaignsResponse.json();
          setAllCampaigns(campaignsData.campaigns || []);
        } else {
          // Use campaigns from reports data as fallback
          setAllCampaigns(reportsData.campaigns || []);
        }
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }
    
    loadAllData();
  }, []);

  // Client-side filtering and sorting (instant, no API calls)
  const filteredAndSortedLinks = useMemo(() => {
    if (!allLinks.length) return [];

    let filtered = allLinks.filter((link: Link) => {
      // Campaign filter
      if (selectedCampaign !== "all" && link.campaign !== selectedCampaign) {
        return false;
      }

      // Search filter - check description, URLs, title
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const searchableFields = [
          link.description,
          link.longurl,
          link.shorturl,
          link.title
        ].filter(Boolean).join(' ').toLowerCase();
        
        if (!searchableFields.includes(query)) {
          return false;
        }
      }

      // Minimum clicks filter
      if (minClicks && link.clicks < parseInt(minClicks)) {
        return false;
      }

      // Date range filter
      if (dateFrom || dateTo) {
        const linkDate = new Date(link.createdAt);
        if (dateFrom && linkDate < new Date(dateFrom)) {
          return false;
        }
        if (dateTo && linkDate > new Date(dateTo + 'T23:59:59')) {
          return false;
        }
      }

      return true;
    });

    // Sort the filtered results
    filtered.sort((a: Link, b: Link) => {
      let aValue: string | number | Date;
      let bValue: string | number | Date;

      switch (sortField) {
        case 'description':
          aValue = a.description.toLowerCase();
          bValue = b.description.toLowerCase();
          break;
        case 'shorturl':
          aValue = a.shorturl.toLowerCase();
          bValue = b.shorturl.toLowerCase();
          break;
        case 'longurl':
          aValue = a.longurl.toLowerCase();
          bValue = b.longurl.toLowerCase();
          break;
        case 'campaign':
          aValue = a.campaign.toLowerCase();
          bValue = b.campaign.toLowerCase();
          break;
        case 'clicks':
          aValue = Number(a.clicks);
          bValue = Number(b.clicks);
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        default:
          aValue = '';
          bValue = '';
      }

      if (aValue < bValue) {
        return sortDirection === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });

    return filtered;
  }, [allLinks, selectedCampaign, searchQuery, minClicks, dateFrom, dateTo, sortField, sortDirection]);

  // Calculate summary stats for current filtered view
  const currentViewSummary = useMemo(() => {
    const totalClicks = filteredAndSortedLinks.reduce((sum: number, link: Link) => sum + link.clicks, 0);
    const totalUniqueClicks = filteredAndSortedLinks.reduce((sum: number, link: Link) => sum + (link.uniqueClicks || 0), 0);
    
    const clicksByUrl = filteredAndSortedLinks.reduce((acc: Record<string, any>, link: Link) => {
      acc[link.shorturl] = {
        title: link.description || link.title || link.shorturl,
        clicks: link.clicks,
        uniqueClicks: link.uniqueClicks || 0,
      };
      return acc;
    }, {});

    return {
      totalLinks: filteredAndSortedLinks.length,
      totalClicks,
      totalUniqueClicks,
      clicksByUrl,
    };
  }, [filteredAndSortedLinks]);

  // Event handlers
  const runReport = useCallback(() => {
    setShowTable(true);
  }, []);

  const resetFilters = useCallback(() => {
    setSelectedCampaign("all");
    setSearchQuery("");
    setMinClicks("");
    setDateFrom("");
    setDateTo("");
    setShowTable(false);
  }, []);

  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }, [sortField, sortDirection]);

  const openEditLink = useCallback((linkId: number) => {
    const editUrl = `https://link.josephjacobs.org/user/links/${linkId}/edit`;
    window.open(editUrl, '_blank', 'noopener,noreferrer');
  }, []);

  // CSV Export - exports exactly what's currently displayed
  const exportToCSV = useCallback(() => {
    if (!filteredAndSortedLinks.length) {
      // Still allow export when empty - export headers and zero summary
      const headers = [
        'Description',
        'Short URL',
        'Original URL',
        'Campaign',
        'Total Clicks',
        'Unique Clicks',
        'Created At'
      ];

      const csvData = [
        headers.join(','),
        '',
        '--- SUMMARY ---',
        `"Total Links","0","","","","","",""`,
        `"Total Clicks","0","","","","","",""`,
        `"Total Unique Clicks","0","","","","","",""`
      ].join('\n');

      downloadCSV(csvData, 'empty');
      return;
    }

    const headers = [
      'Description',
      'Short URL',
      'Original URL',
      'Campaign',
      'Total Clicks',
      'Unique Clicks',
      'Created At'
    ];

    const csvData = [
      headers.join(','),
      ...filteredAndSortedLinks.map((link: Link) => [
        `"${(link.description || link.title || '').replace(/"/g, '""')}"`,
        `"${link.shorturl}"`,
        `"${link.longurl}"`,
        `"${link.campaign}"`,
        link.clicks.toString(),
        (link.uniqueClicks || 0).toString(),
        `"${new Date(link.createdAt).toLocaleDateString()}"`
      ].join(',')),
      '',
      '--- SUMMARY ---',
      `"Total Links","${currentViewSummary.totalLinks}","","","","",""`,
      `"Total Clicks","${currentViewSummary.totalClicks}","","","","",""`,
      `"Total Unique Clicks","${currentViewSummary.totalUniqueClicks}","","","","",""`
    ].join('\n');

    // Generate filename based on current filters
    let filename = 'report';
    if (selectedCampaign !== "all") {
      filename += `-${selectedCampaign.replace(/[^a-zA-Z0-9]/g, '-')}`;
    } else if (searchQuery) {
      filename += `-${searchQuery.replace(/[^a-zA-Z0-9]/g, '-')}`;
    } else {
      filename += '-all-links';
    }
    
    downloadCSV(csvData, filename);
  }, [filteredAndSortedLinks, currentViewSummary, selectedCampaign, searchQuery]);

  const downloadCSV = useCallback((csvData: string, filenameSuffix: string) => {
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    
    const today = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `report-${filenameSuffix}-${today}.csv`);
    
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  const retryLoad = useCallback(() => {
    window.location.reload();
  }, []);

  // Sort icon component
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <span className="text-gray-400">↕</span>;
    return (
      <span className="text-blue-600">
        {sortDirection === 'asc' ? '↑' : '↓'}
      </span>
    );
  };

  // Loading state
  if (loading) {
    return (
      <ProtectedLayout>
        <Header title="Link Reports" />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-xl text-gray-600 dark:text-gray-300 mb-4">
                Loading all links and campaigns...
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                This may take a moment as we preload all data for fast filtering
              </div>
            </div>
          </div>
        </div>
      </ProtectedLayout>
    );
  }

  // Error state with retry
  if (error) {
    return (
      <ProtectedLayout>
        <Header title="Link Reports" />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <h3 className="text-lg font-medium text-red-800 dark:text-red-200 mb-2">
              Failed to Load Reports Data
            </h3>
            <p className="text-red-600 dark:text-red-300 mb-4">{error}</p>
            <div className="flex gap-4">
              <Button
                onClick={retryLoad}
                className="bg-red-600 hover:bg-red-700"
              >
                Retry
              </Button>
              <Button
                onClick={() => setError("")}
                className="bg-gray-600 hover:bg-gray-700"
              >
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      </ProtectedLayout>
    );
  }

  return (
    <ProtectedLayout>
      <Header title="Link Reports" />
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Data Summary Header */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-blue-800 dark:text-blue-200">
                Data Loaded Successfully
              </h3>
              <p className="text-blue-600 dark:text-blue-300">
                {allLinks.length.toLocaleString()} links across {allCampaigns.length} campaigns loaded and ready for instant filtering
              </p>
            </div>
            <div className="text-2xl">📊</div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Filters & Search
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {/* Campaign Filter */}
            <div>
              <Label htmlFor="campaign">Campaign</Label>
              <Select
                id="campaign"
                value={selectedCampaign}
                onChange={(e) => setSelectedCampaign(e.target.value)}
              >
                <option value="all">All Campaigns</option>
                {allCampaigns.map((campaign) => (
                  <option key={campaign.id} value={campaign.name}>
                    {campaign.name}
                  </option>
                ))}
              </Select>
            </div>

            {/* Search Bar */}
            <div>
              <Label htmlFor="search">Search Links</Label>
              <Input
                id="search"
                type="text"
                placeholder="Search description, URLs, title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Minimum Clicks Filter */}
            <div>
              <Label htmlFor="minClicks">Minimum Clicks</Label>
              <Input
                id="minClicks"
                type="number"
                placeholder="0"
                min="0"
                value={minClicks}
                onChange={(e) => setMinClicks(e.target.value)}
              />
            </div>

            {/* Date From */}
            <div>
              <Label htmlFor="dateFrom">Created After</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            {/* Date To */}
            <div>
              <Label htmlFor="dateTo">Created Before</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 items-center">
            <Button 
              onClick={runReport} 
              className="bg-blue-600 hover:bg-blue-700"
            >
              🔍 Run Report ({filteredAndSortedLinks.length.toLocaleString()} links)
            </Button>
            <Button 
              onClick={resetFilters} 
              className="bg-gray-600 hover:bg-gray-700"
            >
              🔄 Reset Filters
            </Button>
            <Button 
              onClick={exportToCSV}
              className="bg-green-600 hover:bg-green-700"
              disabled={!showTable}
            >
              📥 Export Current View
            </Button>
          </div>
        </div>

        {/* Summary Statistics */}
        {showTable && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Current View Summary
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {currentViewSummary.totalLinks.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Total Links</div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {currentViewSummary.totalClicks.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Total Clicks</div>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {currentViewSummary.totalUniqueClicks.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Unique Clicks</div>
              </div>
            </div>
          </div>
        )}

        {/* Results Table */}
        {showTable && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Report Results
              </h2>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Showing {filteredAndSortedLinks.length.toLocaleString()} of {allLinks.length.toLocaleString()} total links
              </div>
            </div>

            {filteredAndSortedLinks.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No links match your filters
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Try adjusting your search criteria or removing some filters
                </p>
                <Button 
                  onClick={resetFilters}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Clear All Filters
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                        onClick={() => handleSort('description')}
                      >
                        Description <SortIcon field="description" />
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                        onClick={() => handleSort('shorturl')}
                      >
                        Short URL <SortIcon field="shorturl" />
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                        onClick={() => handleSort('longurl')}
                      >
                        Original URL <SortIcon field="longurl" />
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                        onClick={() => handleSort('campaign')}
                      >
                        Campaign <SortIcon field="campaign" />
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                        onClick={() => handleSort('clicks')}
                      >
                        Total Clicks <SortIcon field="clicks" />
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                        onClick={() => handleSort('createdAt')}
                      >
                        Created At <SortIcon field="createdAt" />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredAndSortedLinks.map((link: Link) => (
                      <tr key={link.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                          <div className="max-w-xs">
                            <div className="font-medium truncate" title={link.description || link.title || 'No description'}>
                              {link.description || link.title || 'No description'}
                            </div>
                            {link.title && link.description && link.title !== link.description && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 truncate" title={link.title}>
                                {link.title}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <a 
                            href={link.shorturl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:underline font-mono text-xs"
                            title={link.shorturl}
                          >
                            {link.shorturl.replace('https://', '')}
                          </a>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                          <div className="max-w-xs">
                            <a 
                              href={link.longurl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="hover:underline truncate block text-xs"
                              title={link.longurl}
                            >
                              {link.longurl}
                            </a>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                            {link.campaign}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                          <div>
                            <div className="font-bold text-lg">{link.clicks.toLocaleString()}</div>
                            {link.uniqueClicks !== undefined && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {link.uniqueClicks.toLocaleString()} unique
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                          <div>
                            <div>{new Date(link.createdAt).toLocaleDateString()}</div>
                            <div className="text-xs text-gray-400">
                              {new Date(link.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <button
                            onClick={() => openEditLink(link.id)}
                            className="inline-flex items-center px-3 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded-md hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800 transition-colors"
                            title="Edit this link"
                          >
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Empty State - shown when no table is displayed yet */}
        {!showTable && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
              Ready to Generate Report
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              All {allLinks.length.toLocaleString()} links are loaded and ready. 
              Apply filters above and click "Run Report" to view your data.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              💡 Tip: Use the campaign dropdown and search bar together for targeted reports
            </p>
          </div>
        )}
      </div>
    </ProtectedLayout>
  );
}
