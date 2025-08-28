"use client";
import { useEffect, useState, useMemo, useCallback, useRef } from "react";
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

interface ColumnConfig {
  key: string;
  label: string;
  field: SortField | 'actions';
  width: number;
  sortable: boolean;
}

interface LoadingState {
  isLoading: boolean;
  loadedCount: number;
  totalCount: number;
  currentPage: number;
  isComplete: boolean;
  error?: string;
}

export default function ReportsPage() {
  // Column configuration with drag and drop
  const [columns, setColumns] = useState<ColumnConfig[]>([
    { key: 'description', label: 'Description', field: 'description', width: 200, sortable: true },
    { key: 'shorturl', label: 'Short URL', field: 'shorturl', width: 150, sortable: true },
    { key: 'longurl', label: 'Destination URL', field: 'longurl', width: 300, sortable: true },
    { key: 'campaign', label: 'Campaign', field: 'campaign', width: 120, sortable: true },
    { key: 'clicks', label: 'Total Clicks', field: 'clicks', width: 100, sortable: true },
    { key: 'createdAt', label: 'Created At', field: 'createdAt', width: 140, sortable: true },
    { key: 'actions', label: 'Actions', field: 'actions', width: 100, sortable: false }
  ]);
  const [draggedColumn, setDraggedColumn] = useState<number | null>(null);

  // Progressive loading states
  const [allLinks, setAllLinks] = useState<Link[]>([]);
  const [allCampaigns, setAllCampaigns] = useState<Campaign[]>([]);
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: false,
    loadedCount: 0,
    totalCount: 0,
    currentPage: 0,
    isComplete: false
  });
  const [error, setError] = useState<string>("");
  const abortControllerRef = useRef<AbortController | null>(null);
  
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

  // Progressive data loading with real-time updates
  useEffect(() => {
    let isMounted = true;
    
    async function loadDataProgressively() {
      // Cancel any existing load operation
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // Create new abort controller for this operation
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;
      
      try {
        setError("");
        setLoadingState({
          isLoading: true,
          loadedCount: 0,
          totalCount: 0,
          currentPage: 1,
          isComplete: false
        });
        
        // First, quickly load campaigns (small dataset)
        const campaignsResponse = await fetch('/api/campaigns?limit=1000', { signal });
        if (campaignsResponse.ok && isMounted) {
          const campaignsData = await campaignsResponse.json();
          setAllCampaigns(campaignsData.campaigns || []);
        }
        
        // Start progressive link loading
        let currentPage = 1;
        let hasMorePages = true;
        let allLoadedLinks: Link[] = [];
        
        while (hasMorePages && isMounted && !signal.aborted) {
          const linksResponse = await fetch(`/api/reports?limit=100&page=${currentPage}`, { signal });
          
          if (!linksResponse.ok) {
            throw new Error(`HTTP ${linksResponse.status}: ${linksResponse.statusText}`);
          }
          
          const data = await linksResponse.json();
          console.log(`📊 Page ${currentPage} loaded ${data.links?.length || 0} links`);
          
          const newLinks = data.links || [];
          
          if (newLinks.length > 0 && isMounted) {
            allLoadedLinks = [...allLoadedLinks, ...newLinks];
            setAllLinks([...allLoadedLinks]); // Trigger re-render with new data
            
            // Update loading progress
            setLoadingState(prev => ({
              ...prev,
              loadedCount: allLoadedLinks.length,
              totalCount: data.summary?.totalLinks || allLoadedLinks.length,
              currentPage: currentPage,
              isComplete: !data.pagination?.hasNextPage || newLinks.length < 100
            }));
            
            // Small delay to show progressive loading (remove in production if too slow)
            await new Promise(resolve => setTimeout(resolve, 50));
          }
          
          // Check if we have more pages
          hasMorePages = data.pagination?.hasNextPage && newLinks.length === 100;
          currentPage++;
          
          // Safety limit to prevent infinite loops
          if (currentPage > 100) {
            hasMorePages = false;
          }
        }
        
        if (isMounted && !signal.aborted) {
          setLoadingState(prev => ({
            ...prev,
            isLoading: false,
            isComplete: true
          }));
        }
        
      } catch (err) {
        if (isMounted && !signal.aborted) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to load data';
          setError(errorMessage);
          setLoadingState(prev => ({
            ...prev,
            isLoading: false,
            error: errorMessage
          }));
        }
      }
    }
    
    loadDataProgressively();
    
    // Cleanup function
    return () => {
      isMounted = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []); // Only run once on mount

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
          aValue = (a.description || '').toLowerCase();
          bValue = (b.description || '').toLowerCase();
          break;
        case 'shorturl':
          aValue = (a.shorturl || '').toLowerCase();
          bValue = (b.shorturl || '').toLowerCase();
          break;
        case 'longurl': 
          aValue = (a.longurl || '').toLowerCase();
          bValue = (b.longurl || '').toLowerCase();
          break;
        case 'campaign':
          aValue = (a.campaign || '').toLowerCase();
          bValue = (b.campaign || '').toLowerCase();
          break;
        case 'clicks':
          aValue = Number(a.clicks || 0);
          bValue = Number(b.clicks || 0);
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt || 0);
          bValue = new Date(b.createdAt || 0);
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

  // Column drag and drop handlers
  const handleColumnDragStart = (e: React.DragEvent, index: number) => {
    setDraggedColumn(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleColumnDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleColumnDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedColumn === null || draggedColumn === dropIndex) {
      setDraggedColumn(null);
      return;
    }

    const newColumns = [...columns];
    const draggedItem = newColumns[draggedColumn];
    newColumns.splice(draggedColumn, 1);
    newColumns.splice(dropIndex, 0, draggedItem);
    
    setColumns(newColumns);
    setDraggedColumn(null);
  };

  const handleColumnResize = (index: number, newWidth: number) => {
    const newColumns = [...columns];
    newColumns[index].width = Math.max(50, newWidth);
    setColumns(newColumns);
  };

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
        'Destination URL',
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
      'Destination URL',
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
    
    // Create timestamp for unique filename (YYYY-MM-DD-HHMMSS format) - same as bulk link creator
    const now = new Date();
    const timestamp = now.toISOString().replace(/:/g, '').replace(/\..+/, '').replace('T', '-');
    
    link.setAttribute('download', `report-${filenameSuffix}-${timestamp}.csv`);
    
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
  if (loadingState.isLoading && allLinks.length === 0) {
    return (
      <ProtectedLayout>
        <Header title="Link Reports" />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-xl text-gray-600 dark:text-gray-300 mb-4">
                🚀 Starting data load...
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Loading campaigns and preparing for link data
              </div>
              <div className="mt-4 w-64 bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '10%' }}></div>
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
        
        {/* Real-time Loading Progress */}
        {loadingState.isLoading && allLinks.length > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-lg font-medium text-blue-800 dark:text-blue-200">
                  📡 Loading Data in Real-time
                </h3>
                <p className="text-blue-600 dark:text-blue-300">
                  {loadingState.loadedCount.toLocaleString()} of ~{loadingState.totalCount.toLocaleString()} links loaded
                  {loadingState.currentPage > 1 && ` (Page ${loadingState.currentPage})`}
                </p>
              </div>
              <div className="text-2xl animate-spin">⚡</div>
            </div>
            <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                style={{ 
                  width: `${Math.min(100, (loadingState.loadedCount / Math.max(loadingState.totalCount, loadingState.loadedCount)) * 100)}%` 
                }}
              ></div>
            </div>
            <p className="text-xs text-blue-500 dark:text-blue-400 mt-1">
              💡 You can start filtering the loaded data while more loads in the background
            </p>
          </div>
        )}

        {/* Completion Notice */}
        {loadingState.isComplete && !loadingState.isLoading && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-green-800 dark:text-green-200">
                  ✅ All Data Loaded Successfully
                </h3>
                <p className="text-green-600 dark:text-green-300">
                  {allLinks.length.toLocaleString()} links across {allCampaigns.length} campaigns ready for instant filtering
                </p>
              </div>
              <div className="text-2xl">🎉</div>
            </div>
          </div>
        )}

        {/* Data Summary Header - show as soon as we have some data */}
        {allLinks.length > 0 && (
          <div className="bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">
                  📊 Dataset Overview
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {allLinks.length.toLocaleString()} links • {allCampaigns.length} campaigns
                  {loadingState.isLoading && " • Still loading more..."}
                </p>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Last updated: {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>
        )}

        {/* Filters Section - available as soon as we have data */}
        {allLinks.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              🔍 Filters & Search
              <span className="text-sm font-normal text-gray-500 ml-2">
                (Filtering {allLinks.length.toLocaleString()} loaded links)
              </span>
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {/* Campaign Filter */}
              <div>
                <label htmlFor="campaign" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Campaign
                </label>
                <Select
                  id="campaign"
                  value={selectedCampaign}
                  onChange={(e) => setSelectedCampaign(e.target.value)}
                >
                  <option value="all">All Campaigns ({allCampaigns.length})</option>
                  {allCampaigns.map((campaign) => (
                    <option key={campaign.id} value={campaign.name}>
                      {campaign.name}
                    </option>
                  ))}
                </Select>
              </div>

              {/* Search Bar */}
              <div>
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Search Links
                </label>
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
                <label htmlFor="minClicks" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Minimum Clicks
                </label>
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
                <label htmlFor="dateFrom" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Created After
                </label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>

              {/* Date To */}
              <div>
                <label htmlFor="dateTo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Created Before
                </label>
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
                disabled={filteredAndSortedLinks.length === 0}
              >
                🔍 Run Report ({filteredAndSortedLinks.length.toLocaleString()} matches)
              </Button>
              <Button 
                onClick={() => window.location.reload()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                🔄 Refresh Data
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
                disabled={!showTable || filteredAndSortedLinks.length === 0}
              >
                📥 Export Current View
              </Button>
              {loadingState.isLoading && (
                <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                  <span className="animate-pulse">🔄</span>
                  <span className="ml-1">More data loading...</span>
                </div>
              )}
            </div>
          </div>
        )}

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
                <table className="w-full table-fixed border-collapse">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      {columns.map((column, index) => (
                        <th
                          key={column.key}
                          draggable
                          onDragStart={(e) => handleColumnDragStart(e, index)}
                          onDragOver={handleColumnDragOver}
                          onDrop={(e) => handleColumnDrop(e, index)}
                          style={{ width: column.width, minWidth: column.width, maxWidth: column.width }}
                          className={`px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider relative group border-r border-gray-200 dark:border-gray-600 ${
                            column.sortable ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600' : ''
                          } ${draggedColumn === index ? 'opacity-50' : ''}`}
                          onClick={column.sortable ? () => handleSort(column.field as SortField) : undefined}
                        >
                          <div className="flex items-center justify-between">
                            <span className="select-none">
                              {column.label}
                              {column.sortable && sortField === column.field && (
                                <span className="ml-1 text-blue-600">
                                  {sortDirection === "asc" ? "↑" : "↓"}
                                </span>
                              )}
                            </span>
                            <div className="flex items-center">
                              <div className="w-1 h-4 bg-gray-300 dark:bg-gray-600 mr-2 cursor-grab active:cursor-grabbing hover:bg-gray-400 dark:hover:bg-gray-500" title="Drag to reorder"/>
                              <div
                                className="w-1 h-4 bg-blue-400 cursor-col-resize hover:bg-blue-600 active:bg-blue-700"
                                title="Drag to resize"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  const startX = e.clientX;
                                  const startWidth = column.width;
                                  
                                  const handleMouseMove = (e: MouseEvent) => {
                                    const newWidth = Math.max(50, startWidth + (e.clientX - startX));
                                    handleColumnResize(index, newWidth);
                                  };
                                  
                                  const handleMouseUp = () => {
                                    document.removeEventListener('mousemove', handleMouseMove);
                                    document.removeEventListener('mouseup', handleMouseUp);
                                  };
                                  
                                  document.addEventListener('mousemove', handleMouseMove);
                                  document.addEventListener('mouseup', handleMouseUp);
                                }}
                              />
                            </div>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredAndSortedLinks.map((link: Link) => (
                      <tr key={link.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        {columns.map((column) => (
                          <td 
                            key={column.key} 
                            className="px-4 py-4 text-sm text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-600"
                            style={{ width: column.width, minWidth: column.width, maxWidth: column.width }}
                          >
                            {column.key === 'description' && (
                              <div className="overflow-hidden">
                                <div className="font-medium truncate" title={link.description || 'No description'}>
                                  {link.description || 'No description'}
                                </div>
                                {link.title && link.title !== link.description && (
                                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate" title={link.title}>
                                    {link.title}
                                  </div>
                                )}
                              </div>
                            )}
                            {column.key === 'shorturl' && (
                              <a 
                                href={link.shorturl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 dark:text-blue-400 hover:underline font-mono text-xs block truncate"
                                title={link.shorturl}
                              >
                                {link.shorturl.replace('https://', '')}
                              </a>
                            )}
                            {column.key === 'longurl' && (
                              <div className="overflow-hidden">
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
                            )}
                            {column.key === 'campaign' && (
                              <div className="overflow-hidden">
                                <button
                                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 hover:bg-blue-100 hover:text-blue-700 transition-colors cursor-pointer max-w-full"
                                  title={`Filter by campaign: ${link.campaign}`}
                                  onClick={() => setSelectedCampaign(link.campaign)}
                                >
                                  <span className="truncate">{link.campaign}</span>
                                </button>
                              </div>
                            )}
                            {column.key === 'clicks' && (
                              <div>
                                <div className="font-bold text-lg">{link.clicks.toLocaleString()}</div>
                                {link.uniqueClicks !== undefined && (
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {link.uniqueClicks.toLocaleString()} unique
                                  </div>
                                )}
                              </div>
                            )}
                            {column.key === 'createdAt' && (
                              <div>
                                <div>{new Date(link.createdAt).toLocaleDateString()}</div>
                                <div className="text-xs text-gray-400">
                                  {new Date(link.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </div>
                              </div>
                            )}
                            {column.key === 'actions' && (
                              <button
                                onClick={() => openEditLink(link.id)}
                                className="inline-flex items-center px-3 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded-md hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800 transition-colors"
                                title="Edit this link"
                              >
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Edit
                              </button>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Empty State - shown when no data is loaded yet */}
        {allLinks.length === 0 && !loadingState.isLoading && !error && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
            <div className="text-6xl mb-4">�</div>
            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
              Ready to Load Link Data
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Click "Start Loading" to begin progressive data loading with real-time updates.
            </p>
            <Button 
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              🔄 Start Loading Data
            </Button>
          </div>
        )}
      </div>
    </ProtectedLayout>
  );
}
