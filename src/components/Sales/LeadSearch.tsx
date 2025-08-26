import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Search, MapPin, Building, Globe, Phone, Download, Loader2, X } from 'lucide-react';
import { useLeads } from '../../hooks/useLeads';
import { useCustomers } from '../../hooks/useCustomers';
import { useAuth } from '../../contexts/AuthContext';

declare const google: any;

const GOOGLE_MAPS_LIBRARIES = ['places'];

function loadGoogleMaps(apiKey: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Already loaded
    if (typeof window !== 'undefined' && (window as any).google && (window as any).google.maps) {
      resolve();
      return;
    }

    // Avoid duplicate script tags
    const existing = document.querySelector('script[data-google-maps]') as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Failed to load Google Maps script')));
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=${GOOGLE_MAPS_LIBRARIES.join(',')}`;
    script.async = true;
    script.defer = true;
    script.setAttribute('data-google-maps', 'true');
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Maps script'));
    document.head.appendChild(script);
  });
}

type PlaceResultLite = {
  placeId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  phone?: string;
  website?: string;
  types?: string[];
  selected?: boolean;
  imported?: boolean;
  existsAs?: 'lead' | 'customer';
};

type SearchState = {
  locationInput: string;
  queryInput: string;
  results: PlaceResultLite[];
  mapCenter?: { lat: number; lng: number };
  mapZoom?: number;
};

const SEARCH_STATE_KEY = 'leadSearch_state';

export const LeadSearch: React.FC = () => {
  const { addLead, leads } = useLeads();
  const { customers } = useCustomers();
  const { user } = useAuth();

  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  const [apiReady, setApiReady] = useState(false);
  const [locationInput, setLocationInput] = useState('');
  const [queryInput, setQueryInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<PlaceResultLite[]>([]);
  const [importing, setImporting] = useState(false);
  const [importMessages, setImportMessages] = useState<string[]>([]);

  const apiKey = useMemo(() => import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined, []);

  // Function to check if a business already exists
  const checkExistingRecords = useCallback((places: PlaceResultLite[]) => {
    return places.map(place => {
      const normalizedName = place.name.toLowerCase().trim();
      
      // Check if exists as customer
      const existsAsCustomer = customers.some(customer => 
        customer.companyName.toLowerCase().trim() === normalizedName
      );
      
      // Check if exists as lead
      const existsAsLead = leads.some(lead => 
        lead.companyName.toLowerCase().trim() === normalizedName
      );
      
      return {
        ...place,
        imported: existsAsCustomer || existsAsLead,
        existsAs: existsAsCustomer ? 'customer' as const : existsAsLead ? 'lead' as const : undefined
      };
    });
  }, [customers, leads]);

  // Helper functions for search state persistence
  const saveSearchState = useCallback(() => {
    const state: SearchState = {
      locationInput,
      queryInput,
      results,
      mapCenter: mapInstanceRef.current ? {
        lat: mapInstanceRef.current.getCenter().lat(),
        lng: mapInstanceRef.current.getCenter().lng()
      } : undefined,
      mapZoom: mapInstanceRef.current ? mapInstanceRef.current.getZoom() : undefined
    };
    localStorage.setItem(SEARCH_STATE_KEY, JSON.stringify(state));
  }, [locationInput, queryInput, results]);

  const restoreSearchState = useCallback(() => {
    try {
      const saved = localStorage.getItem(SEARCH_STATE_KEY);
      if (saved) {
        const state: SearchState = JSON.parse(saved);
        setLocationInput(state.locationInput || '');
        setQueryInput(state.queryInput || '');
        
        // Check existing records when restoring
        if (state.results && state.results.length > 0) {
          const resultsWithStatus = checkExistingRecords(state.results);
          setResults(resultsWithStatus);
        }
        return state;
      }
    } catch (error) {
      console.error('Error restoring search state:', error);
    }
    return null;
  }, [checkExistingRecords]);

  const clearSearchState = useCallback(() => {
    localStorage.removeItem(SEARCH_STATE_KEY);
  }, []);

  useEffect(() => {
    if (!apiKey) return;
    loadGoogleMaps(apiKey)
      .then(() => {
        setApiReady(true);
        
        // Restore search state first
        const savedState = restoreSearchState();
        
        // Initialize map with saved center/zoom if available
        if (mapRef.current && !mapInstanceRef.current) {
          const mapOptions = {
            center: savedState?.mapCenter || { lat: -33.865143, lng: 151.2099 }, // Sydney default
            zoom: savedState?.mapZoom || 12,
          };
          mapInstanceRef.current = new google.maps.Map(mapRef.current, mapOptions);
          
          // If we have saved results, recreate the markers
          if (savedState?.results && savedState.results.length > 0) {
            recreateMarkersFromResults(savedState.results);
          }
        }
      })
      .catch((e) => setError(e.message));
  }, [apiKey, restoreSearchState]);

  // Save state when inputs change (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (locationInput || queryInput) {
        saveSearchState();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [locationInput, queryInput, saveSearchState]);

  // Re-check existing records when leads or customers change
  useEffect(() => {
    if (results.length > 0) {
      const updatedResults = checkExistingRecords(results);
      // Only update if there are actual changes to avoid infinite loops
      const hasChanges = updatedResults.some((updated, index) => 
        updated.imported !== results[index]?.imported || 
        updated.existsAs !== results[index]?.existsAs
      );
      if (hasChanges) {
        setResults(updatedResults);
      }
    }
  }, [leads, customers, results, checkExistingRecords]);

  const clearMarkers = useCallback(() => {
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
  }, []);

  const fitBoundsToMarkers = useCallback(() => {
    const map = mapInstanceRef.current;
    if (!map || markersRef.current.length === 0) return;
    const bounds = new google.maps.LatLngBounds();
    markersRef.current.forEach((m) => bounds.extend(m.getPosition()));
    map.fitBounds(bounds);
  }, []);

  const recreateMarkersFromResults = useCallback((places: PlaceResultLite[]) => {
    const map = mapInstanceRef.current;
    if (!map || !apiReady) return;
    
    clearMarkers();
    
    // Check existing records when recreating markers
    const placesWithStatus = checkExistingRecords(places);
    
    placesWithStatus.forEach((place) => {
      const marker = new google.maps.Marker({
        position: { lat: place.lat, lng: place.lng },
        map: map,
        title: place.name,
        icon: place.selected ? {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#10b981"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>'),
          scaledSize: new google.maps.Size(24, 24),
          origin: new google.maps.Point(0, 0),
          anchor: new google.maps.Point(12, 24)
        } : place.imported ? {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#9CA3AF"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>'),
          scaledSize: new google.maps.Size(24, 24),
          origin: new google.maps.Point(0, 0),
          anchor: new google.maps.Point(12, 24)
        } : undefined
      });
      
      markersRef.current.push(marker);
    });
    
    if (places.length > 0) {
      fitBoundsToMarkers();
    }
    
    // Update results with status
    setResults(placesWithStatus);
  }, [apiReady, clearMarkers, fitBoundsToMarkers, checkExistingRecords]);

  const geocodeLocation = useCallback(async (locationText: string): Promise<{ lat: number; lng: number } | null> => {
    return new Promise((resolve) => {
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ address: locationText }, (res: any[], status: string) => {
        if (status === 'OK' && res && res[0]) {
          const loc = res[0].geometry.location;
          resolve({ lat: loc.lat(), lng: loc.lng() });
        } else {
          resolve(null);
        }
      });
    });
  }, []);

  const searchPlaces = useCallback(async () => {
    if (!apiReady || !mapInstanceRef.current) return;
    setLoading(true);
    setError(null);
    setResults([]);

    try {
      const map = mapInstanceRef.current;
      const location = locationInput.trim();
      const query = queryInput.trim();
      if (!location || !query) {
        setError('Please enter both location and a business type/name.');
        setLoading(false);
        return;
      }

      const center = await geocodeLocation(location);
      if (!center) {
        setError('Could not find the specified location.');
        setLoading(false);
        return;
      }

      map.setCenter(center);
      map.setZoom(13);

      const service = new google.maps.places.PlacesService(map);
      const textRequest = {
        query,
        location: new google.maps.LatLng(center.lat, center.lng),
        radius: 10000,
      };

      const textResults: any[] = await new Promise((resolve, reject) => {
        service.textSearch(textRequest, (res: any[], status: string) => {
          if (status === google.maps.places.PlacesServiceStatus.OK) resolve(res);
          else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) resolve([]);
          else reject(new Error('Search failed'));
        });
      });

      // Fetch details for richer data (phone, website)
      const detailPromises = textResults.slice(0, 20).map((r) => {
        return new Promise<PlaceResultLite>((resolve) => {
          service.getDetails(
            {
              placeId: r.place_id,
              fields: ['place_id', 'name', 'formatted_address', 'geometry', 'formatted_phone_number', 'international_phone_number', 'website', 'types'],
            },
            (detail: any, status: string) => {
              if (status !== google.maps.places.PlacesServiceStatus.OK || !detail) {
                // Fallback to text result
                resolve({
                  placeId: r.place_id,
                  name: r.name,
                  address: r.formatted_address,
                  lat: r.geometry?.location?.lat?.() ?? center.lat,
                  lng: r.geometry?.location?.lng?.() ?? center.lng,
                  types: r.types ?? [],
                });
                return;
              }
              resolve({
                placeId: detail.place_id,
                name: detail.name,
                address: detail.formatted_address,
                lat: detail.geometry?.location?.lat?.() ?? center.lat,
                lng: detail.geometry?.location?.lng?.() ?? center.lng,
                phone: detail.formatted_phone_number || detail.international_phone_number,
                website: detail.website,
                types: detail.types ?? [],
              });
            }
          );
        });
      });

      const places: PlaceResultLite[] = await Promise.all(detailPromises);

      // Check for existing records and mark them
      const placesWithStatus = checkExistingRecords(places);

      clearMarkers();
      placesWithStatus.forEach((p) => {
        const marker = new google.maps.Marker({
          position: { lat: p.lat, lng: p.lng },
          map,
          title: p.name,
          icon: p.imported ? {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#9CA3AF"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>'),
            scaledSize: new google.maps.Size(24, 24),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(12, 24)
          } : undefined
        });
        markersRef.current.push(marker);
      });
      fitBoundsToMarkers();

      setResults(placesWithStatus);
      
      // Save search state after successful search
      setTimeout(() => saveSearchState(), 100);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  }, [apiReady, clearMarkers, fitBoundsToMarkers, geocodeLocation, locationInput, queryInput, saveSearchState, checkExistingRecords]);

  const toggleSelect = useCallback((placeId: string) => {
    setResults((prev) => {
      const updated = prev.map((p) => (p.placeId === placeId ? { ...p, selected: !p.selected } : p));
      // Save state after selection change
      setTimeout(() => saveSearchState(), 100);
      return updated;
    });
  }, [saveSearchState]);

  const clearSearch = useCallback(() => {
    setLocationInput('');
    setQueryInput('');
    setResults([]);
    setError(null);
    clearMarkers();
    clearSearchState();
    
    // Reset map to default view
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setCenter({ lat: -33.865143, lng: 151.2099 });
      mapInstanceRef.current.setZoom(12);
    }
  }, [clearMarkers, clearSearchState]);

  const importSelected = useCallback(async () => {
    const selected = results.filter((r) => r.selected);
    if (selected.length === 0) return;
    
    setImporting(true);
    setImportMessages([]);
    
    const messages: string[] = [];
    let importedCount = 0;
    let skippedCount = 0;
    
    try {
      for (const r of selected) {
        // Check if already exists
        if (r.imported) {
          skippedCount++;
          messages.push(`⚠️ ${r.name} - Skipped (already exists as ${r.existsAs})`);
          continue;
        }
        
        try {
          await addLead({
            companyName: r.name,
            contactName: '',
            contactEmail: '',
            contactPhone: r.phone || '',
            address: r.address,
            website: r.website || '',
            industry: r.types?.[0] || 'other',
            source: 'cold_outreach',
            status: 'new',
            // New field names for created by user
            createdByUserId: user?.id || '',
            createdByUserName: user?.name || '',
            // New field names for assigned to user (assign to current user by default)
            assignedToUserId: user?.id || '',
            assignedToUserName: user?.name || '',
            value: 0,
            notes: [r.address, r.website].filter(Boolean).join(' | '),
            nextFollowUp: new Date().toISOString(),
          } as any);
          
          importedCount++;
          messages.push(`✅ ${r.name} - Successfully imported as new lead`);
          
          // Mark as imported in results
          setResults(prev => prev.map(p => 
            p.placeId === r.placeId 
              ? { ...p, imported: true, existsAs: 'lead' as const }
              : p
          ));
          
        } catch (error) {
          messages.push(`❌ ${r.name} - Failed to import: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
      
      // Set final summary message
      if (importedCount > 0 || skippedCount > 0) {
        const summaryMessage = `Import completed: ${importedCount} imported, ${skippedCount} skipped`;
        messages.unshift(summaryMessage);
      }
      
      setImportMessages(messages);
      
    } finally {
      setImporting(false);
    }
  }, [addLead, results, user]);

  const selectedCount = results.filter(r => r.selected && !r.imported).length;
  const selectedImportedCount = results.filter(r => r.selected && r.imported).length;

  return (
    <div className="space-y-4">
      {/* Search State Indicator */}
      {(results.length > 0 || locationInput || queryInput) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-blue-700">
                {results.length > 0 
                  ? `Previous search loaded: ${results.length} businesses found` 
                  : 'Search terms preserved from previous session'}
              </span>
            </div>
            <button
              onClick={clearSearch}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Start Fresh
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Location (e.g., suburb or city)</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                placeholder="e.g., Brooklyn, NY"
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand focus:border-transparent"
              />
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Business type or name</label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                placeholder="e.g., plumber or Northside Plumbing"
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand focus:border-transparent"
              />
            </div>
          </div>
          <div className="md:col-span-1">
            <button
              onClick={searchPlaces}
              disabled={!apiKey || loading}
              className="w-full inline-flex items-center justify-center space-x-2 px-4 py-2 bg-brand text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              <span>Search</span>
            </button>
            {!apiKey && (
              <p className="mt-2 text-xs text-red-600">Missing VITE_GOOGLE_MAPS_API_KEY</p>
            )}
          </div>
          <div className="md:col-span-1">
            {(results.length > 0 || locationInput || queryInput) && (
              <button
                onClick={clearSearch}
                className="w-full px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                title="Clear search and start fresh"
              >
                <X className="h-4 w-4 mx-auto" />
              </button>
            )}
          </div>
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
          <div ref={mapRef} className="w-full h-[380px] rounded-md" />
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900">Results</h3>
            <button
              onClick={importSelected}
              disabled={importing || selectedCount === 0}
              className="inline-flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
              title={selectedImportedCount > 0 ? `${selectedImportedCount} already imported items will be skipped` : ''}
            >
              {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              <span>
                Import Selected {selectedCount > 0 && `(${selectedCount})`}
                {selectedImportedCount > 0 && (
                  <span className="text-green-200 ml-1">
                    • {selectedImportedCount} duplicate{selectedImportedCount !== 1 ? 's' : ''} will be skipped
                  </span>
                )}
              </span>
            </button>
          </div>

          {results.length === 0 ? (
            <p className="text-sm text-gray-500">No results yet. Try a search.</p>
          ) : (
            <div className="space-y-3 max-h-[380px] overflow-auto pr-1">
              {results.map((r) => (
                <label 
                  key={r.placeId} 
                  className={`flex items-start gap-3 p-3 border border-gray-200 rounded-md cursor-pointer transition-colors ${
                    r.imported 
                      ? 'bg-gray-100 opacity-60 hover:bg-gray-150' 
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={!!r.selected}
                    onChange={() => toggleSelect(r.placeId)}
                    className="mt-1 h-4 w-4"
                    disabled={r.imported}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3">
                      <div className={`truncate text-sm font-medium ${r.imported ? 'text-gray-500' : 'text-gray-900'}`}>
                        {r.name}
                        {r.imported && (
                          <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
                            Already exists as {r.existsAs}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className={`mt-1 text-xs truncate flex items-center ${r.imported ? 'text-gray-400' : 'text-gray-600'}`}>
                      <MapPin className="h-3.5 w-3.5 mr-1" /> {r.address}
                    </div>
                    {r.phone && (
                      <div className={`mt-1 text-xs truncate flex items-center ${r.imported ? 'text-gray-400' : 'text-gray-600'}`}>
                        <Phone className="h-3.5 w-3.5 mr-1" /> {r.phone}
                      </div>
                    )}
                    {r.website && (
                      <div className={`mt-1 text-xs truncate flex items-center ${r.imported ? 'text-gray-400' : 'text-gray-600'}`}>
                        <Globe className="h-3.5 w-3.5 mr-1" />
                        <a 
                          href={r.website} 
                          target="_blank" 
                          rel="noreferrer" 
                          className={`hover:underline truncate ${r.imported ? 'text-gray-400' : 'text-brand'}`}
                        >
                          {r.website}
                        </a>
                      </div>
                    )}
                  </div>
                </label>
              ))}
            </div>
          )}
          
          {/* Import Messages */}
          {importMessages.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Import Results:</h4>
              <div className="bg-gray-50 rounded-md p-3 max-h-48 overflow-y-auto">
                {importMessages.map((message, index) => (
                  <div 
                    key={index} 
                    className={`text-xs mb-1 ${
                      message.startsWith('✅') ? 'text-green-700' : 
                      message.startsWith('⚠️') ? 'text-yellow-700' : 
                      message.startsWith('❌') ? 'text-red-700' : 
                      'text-gray-700 font-medium'
                    }`}
                  >
                    {message}
                  </div>
                ))}
              </div>
              <button
                onClick={() => setImportMessages([])}
                className="mt-2 text-xs text-gray-500 hover:text-gray-700"
              >
                Clear messages
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeadSearch;


