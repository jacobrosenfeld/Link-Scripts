"use client";
import { useEffect, useState, useMemo } from "react";
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

interface ReportsData {
  links: Link[];
  summary: Summary;
  campaigns: Campaign[];
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

type SortField = 'description' | 'shorturl' | 'longurl' | 'campaign' | 'clicks' | 'createdAt';
type SortDirection = 'asc' | 'desc';

export default function ReportsPage() {
  const [data, setData] = useState<ReportsData | null>(null);
  const [allLinks, setAllLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState<string>("");
  const [error, setError] = useState<string>("");
  
  // Filter states
  const [selectedCampaign, setSelectedCampaign] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [minClicks, setMinClicks] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  
  // Display states
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [showTable, setShowTable] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  // Column resizing states
  const [columnWidths, setColumnWidths] = useState({
    description: 200,
    shorturl: 200,
    longurl: 250,
    campaign: 150,
    clicks: 120,
    createdAt: 120,
    actions: 100
  });
  const [isResizing, setIsResizing] = useState<string | null>(null);

  // Load all data in background
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setLoadingProgress("Loading campaigns...");
        
        const response = await fetch('/api/reports?limit=10000');
        if (!response.ok) {
          throw new Error('Failed to fetch reports data');
        }
        
        setLoadingProgress("Processing links...");
        const reportsData: ReportsData = await response.json();
        setData(reportsData);
        setAllLinks(reportsData.links);
        setLoadingProgress("Ready!");
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
        setLoadingProgress("");
      }
    }
    loadData();
  }, []);

  // Filter and sort links
  const filteredAndSortedLinks = useMemo(() => {
    if (!allLinks.length) return [];

    let filtered = allLinks.filter(link => {
      // Campaign filter
      if (selectedCampaign !== "all" && !link.campaign.toLowerCase().includes(selectedCampaign.toLowerCase())) {
        return false;
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !link.description.toLowerCase().includes(query) &&
          !link.longurl.toLowerCase().includes(query) &&
          !link.shorturl.toLowerCase().includes(query) &&
          !link.title.toLowerCase().includes(query)
        ) {
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

    // Sort
    filtered.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      if (sortField === 'clicks') {
        aValue = Number(aValue);
        bValue = Number(bValue);
      } else if (sortField === 'createdAt') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      } else {
        aValue = String(aValue).toLowerCase();
        bValue = String(bValue).toLowerCase();
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

  // Calculate summary for current view
  const currentViewSummary = useMemo(() => {
    const totalClicks = filteredAndSortedLinks.reduce((sum, link) => sum + link.clicks, 0);
    const totalUniqueClicks = filteredAndSortedLinks.reduce((sum, link) => sum + (link.uniqueClicks || 0), 0);
    
    const clicksByUrl = filteredAndSortedLinks.reduce((acc, link) => {
      acc[link.shorturl] = {
        title: link.title || link.description || link.shorturl,
        clicks: link.clicks,
        uniqueClicks: link.uniqueClicks || 0,
      };
      return acc;
    }, {} as Record<string, { title: string; clicks: number; uniqueClicks: number }>);

    return {
      totalLinks: filteredAndSortedLinks.length,
      totalClicks,
      totalUniqueClicks,
      clicksByUrl,
    };
  }, [filteredAndSortedLinks]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredAndSortedLinks.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedLinks = filteredAndSortedLinks.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCampaign, searchQuery, minClicks, dateFrom, dateTo, itemsPerPage]);

  const runReport = () => {
    setShowTable(true);
    setCurrentPage(1); // Reset to first page when running report
  };

  const resetFilters = () => {
    setSelectedCampaign("all");
    setSearchQuery("");
    setMinClicks("");
    setDateFrom("");
    setDateTo("");
    setShowTable(false);
    setCurrentPage(1);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Column resizing handlers
  const handleMouseDown = (columnKey: string) => (e: any) => {
    e.preventDefault();
    setIsResizing(columnKey);
    
    const startX = e.clientX;
    const startWidth = columnWidths[columnKey as keyof typeof columnWidths];
    
    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX;
      const newWidth = Math.max(80, startWidth + deltaX); // Minimum width of 80px
      
      setColumnWidths((prev: any) => ({
        ...prev,
        [columnKey]: newWidth
      }));
    };
    
    const handleMouseUp = () => {
      setIsResizing(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const openEditLink = (linkId: number) => {
    const editUrl = `https://link.josephjacobs.org/user/links/${linkId}/edit`;
    window.open(editUrl, '_blank', 'noopener,noreferrer');
  };

  const exportToCSV = () => {
    if (!filteredAndSortedLinks.length) return;

    const headers = [
      'Description',
      'Short URL',
      'Original URL',
      'Campaign',
      'Total Clicks',
      'Unique Clicks',
      'Created At',
      'Edit URL'
    ];

    const csvData = [
      headers.join(','),
      ...filteredAndSortedLinks.map((link: any) => [
        `"${link.description || link.title || ''}"`,
        `"${link.shorturl}"`,
        `"${link.longurl}"`,
        `"${link.campaign}"`,
        link.clicks.toString(),
        (link.uniqueClicks || 0).toString(),
        `"${new Date(link.createdAt).toLocaleDateString()}"`,
        `"https://link.josephjacobs.org/user/links/${link.id}/edit"`
      ].join(',')),
      '',
      '--- SUMMARY ---',
      `"Total Links","${currentViewSummary.totalLinks}","","","","","",""`,
      `"Total Clicks","${currentViewSummary.totalClicks}","","","","","",""`,
      `"Total Unique Clicks","${currentViewSummary.totalUniqueClicks}","","","","","",""`
    ].join('\n');

    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    
    const campaignName = selectedCampaign !== "all" ? selectedCampaign : searchQuery || "all-links";
    const today = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `report-${campaignName}-${today}.csv`);
    
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <span className="text-gray-400">↕</span>;
    return (
      <span className="text-blue-600">
        {sortDirection === 'asc' ? '↑' : '↓'}
      </span>
    );
  };

  if (loading) {
    return (
      <ProtectedLayout>
        <Header title="Link Reports" />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-xl text-gray-600 dark:text-gray-300 mb-4">
                Loading reports data...
              </div>
              {loadingProgress && (
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {loadingProgress}
                </div>
              )}
              <div className="mt-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            </div>
          </div>
        </div>
      </ProtectedLayout>
    );
  }

  if (error) {
    return (
      <ProtectedLayout>
        <Header title="Link Reports" />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <h3 className="text-lg font-medium text-red-800 dark:text-red-200 mb-2">
              Error Loading Reports
            </h3>
            <p className="text-red-600 dark:text-red-300">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </ProtectedLayout>
    );
  }

  return (
    <ProtectedLayout>
      <Header title="Link Reports" />
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Filters & Search
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div>
              <Label htmlFor="campaign">Campaign</Label>
              <Select
                id="campaign"
                value={selectedCampaign}
                onChange={(e) => setSelectedCampaign(e.target.value)}
              >
                <option value="all">All Campaigns</option>
                {data?.campaigns.map((campaign) => (
                  <option key={campaign.id} value={campaign.name}>
                    {campaign.name}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                type="text"
                placeholder="Search by description, URL..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="minClicks">Minimum Clicks</Label>
              <Input
                id="minClicks"
                type="number"
                placeholder="0"
                value={minClicks}
                onChange={(e) => setMinClicks(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="dateFrom">Date From</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="dateTo">Date To</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-4 items-center flex-wrap">
            <Button onClick={runReport} className="bg-blue-600 hover:bg-blue-700">
              Run Report ({filteredAndSortedLinks.length} links)
            </Button>
            <Button 
              onClick={resetFilters} 
              className="bg-gray-600 hover:bg-gray-700"
            >
              Reset Filters
            </Button>
            
            {/* Items per page selector */}
            <div className="flex items-center gap-2">
              <Label>Links per page:</Label>
              <Select
                value={itemsPerPage.toString()}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="w-20"
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
                <option value="250">250</option>
                <option value="500">500</option>
              </Select>
            </div>
          </div>
        </div>

        {/* Summary Section */}
        {showTable && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Summary Statistics
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {currentViewSummary.totalLinks}
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
              <Button 
                onClick={exportToCSV}
                className="bg-green-600 hover:bg-green-700"
                disabled={!paginatedLinks.length}
              >
                Export to CSV
              </Button>
            </div>

            {paginatedLinks.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                No links match your filters.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full table-fixed">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th 
                        className="relative px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                        style={{ width: `${columnWidths.description}px` }}
                        onClick={() => handleSort('description')}
                      >
                        Description <SortIcon field="description" />
                        <div 
                          className="absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-blue-500 opacity-0 hover:opacity-100"
                          onMouseDown={handleMouseDown('description')}
                        />
                      </th>
                      <th 
                        className="relative px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                        style={{ width: `${columnWidths.shorturl}px` }}
                        onClick={() => handleSort('shorturl')}
                      >
                        Short URL <SortIcon field="shorturl" />
                        <div 
                          className="absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-blue-500 opacity-0 hover:opacity-100"
                          onMouseDown={handleMouseDown('shorturl')}
                        />
                      </th>
                      <th 
                        className="relative px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                        style={{ width: `${columnWidths.longurl}px` }}
                        onClick={() => handleSort('longurl')}
                      >
                        Original URL <SortIcon field="longurl" />
                        <div 
                          className="absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-blue-500 opacity-0 hover:opacity-100"
                          onMouseDown={handleMouseDown('longurl')}
                        />
                      </th>
                      <th 
                        className="relative px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                        style={{ width: `${columnWidths.campaign}px` }}
                        onClick={() => handleSort('campaign')}
                      >
                        Campaign <SortIcon field="campaign" />
                        <div 
                          className="absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-blue-500 opacity-0 hover:opacity-100"
                          onMouseDown={handleMouseDown('campaign')}
                        />
                      </th>
                      <th 
                        className="relative px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                        style={{ width: `${columnWidths.clicks}px` }}
                        onClick={() => handleSort('clicks')}
                      >
                        Clicks <SortIcon field="clicks" />
                        <div 
                          className="absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-blue-500 opacity-0 hover:opacity-100"
                          onMouseDown={handleMouseDown('clicks')}
                        />
                      </th>
                      <th 
                        className="relative px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                        style={{ width: `${columnWidths.createdAt}px` }}
                        onClick={() => handleSort('createdAt')}
                      >
                        Created <SortIcon field="createdAt" />
                        <div 
                          className="absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-blue-500 opacity-0 hover:opacity-100"
                          onMouseDown={handleMouseDown('createdAt')}
                        />
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                        style={{ width: `${columnWidths.actions}px` }}
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {paginatedLinks.map((link: any) => (
                      <tr key={link.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white overflow-hidden">
                          <div className="truncate" title={link.description || link.title || 'No description'}>
                            {link.description || link.title || 'No description'}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm overflow-hidden">
                          <a 
                            href={link.shorturl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:underline truncate block"
                            title={link.shorturl}
                          >
                            {link.shorturl}
                          </a>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300 overflow-hidden">
                          <a 
                            href={link.longurl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="hover:underline truncate block"
                            title={link.longurl}
                          >
                            {link.longurl}
                          </a>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white overflow-hidden">
                          <div className="truncate" title={link.campaign}>
                            {link.campaign}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                          <div>
                            <div className="font-medium">{link.clicks}</div>
                            {link.uniqueClicks !== undefined && (
                              <div className="text-xs text-gray-500">{link.uniqueClicks} unique</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                          {new Date(link.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <button
                            onClick={() => openEditLink(link.id)}
                            className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800 transition-colors"
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

              {/* Pagination Controls */}
              {filteredAndSortedLinks.length > itemsPerPage && (
                <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    Showing {startIndex + 1} to {Math.min(endIndex, filteredAndSortedLinks.length)} of {filteredAndSortedLinks.length} results
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else {
                          if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`px-3 py-1 text-sm border rounded ${
                              currentPage === pageNum
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    
                    <button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
          </div>
        )}
      </div>
    </ProtectedLayout>
  );
}
