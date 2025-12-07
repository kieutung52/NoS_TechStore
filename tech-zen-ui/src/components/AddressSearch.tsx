import React, { useState, useCallback } from 'react';
import { Input } from './ui/input'; 
import { Card, CardContent } from './ui/card'; 
import { Loader2, MapPin } from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce'; 
import { mapService, NominatimResult } from '../services/mapService'; 
import { ScrollArea } from './ui/scroll-area'; 
import { toast } from '../hooks/use-toast'; 

interface AddressSearchProps {
  onAddressSelect: (result: NominatimResult) => void;
}

export const AddressSearch = ({ onAddressSelect }: AddressSearchProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const debouncedQuery = useDebounce(query, 500);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 3) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const data = await mapService.searchAddress(searchQuery);
      setResults(data);
    } catch (error) {
      toast({ title: "Lỗi tìm kiếm", description: "Không thể tìm kiếm địa chỉ", variant: "destructive" });
    }
    setLoading(false);
  }, []);

  React.useEffect(() => {
    performSearch(debouncedQuery);
  }, [debouncedQuery, performSearch]);

  const handleSelect = (result: NominatimResult) => {
    setQuery(result.display_name);
    setShowResults(false);
    onAddressSelect(result);
  };

  return (
    <div className="relative">
      <Input
        type="text"
        placeholder="Tìm địa danh (vd: Aeon Mall Hà Đông)"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setShowResults(true);
        }}
        onFocus={() => setShowResults(true)}
        onBlur={() => setTimeout(() => setShowResults(false), 150)} 
      />
      {showResults && (debouncedQuery.length >= 3) && (
        <Card className="absolute z-10 w-full mt-1 shadow-lg">
          <ScrollArea className="h-auto max-h-60">
            <CardContent className="p-2">
              {loading && (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              )}
              {!loading && results.length === 0 && (
                <div className="p-4 text-sm text-center text-muted-foreground">
                  Không tìm thấy kết quả.
                </div>
              )}
              {!loading && results.length > 0 && (
                <div className="space-y-1">
                  {results.map((result) => (
                    <div
                      key={result.place_id}
                      className="flex items-start gap-3 p-2 rounded-md cursor-pointer hover:bg-accent"
                      onMouseDown={() => handleSelect(result)} 
                    >
                      <MapPin className="h-4 w-4 mt-1 flex-shrink-0 text-muted-foreground" />
                      <span className="text-sm">{result.display_name}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </ScrollArea>
        </Card>
      )}
    </div>
  );
};