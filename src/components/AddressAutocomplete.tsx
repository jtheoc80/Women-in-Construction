'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { MapPin, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

declare global {
  interface Window {
    google: typeof google
    initGooglePlaces?: () => void
  }
}

interface AddressResult {
  formattedAddress: string
  city: string
  area: string
  placeId: string
  lat?: number
  lng?: number
}

interface AddressAutocompleteProps {
  onSelect: (result: AddressResult) => void
  defaultValue?: string
  placeholder?: string
  className?: string
}

// Parse address_components to extract city and area
function parseAddressComponents(components: google.maps.GeocoderAddressComponent[]): { city: string; area: string } {
  let city = ''
  let area = ''

  for (const component of components) {
    const types = component.types

    // City: locality
    if (types.includes('locality')) {
      city = component.long_name
    }

    // Area: try neighborhood first, then sublocality, then administrative_area_level_2
    if (types.includes('neighborhood') && !area) {
      area = component.long_name
    } else if (types.includes('sublocality') && !area) {
      area = component.long_name
    } else if (types.includes('sublocality_level_1') && !area) {
      area = component.long_name
    } else if (types.includes('administrative_area_level_2') && !area) {
      area = component.long_name
    }

    // If no city found, try administrative_area_level_1 (state) as fallback
    if (!city && types.includes('administrative_area_level_1')) {
      city = component.long_name
    }
  }

  return { city, area }
}

export function AddressAutocomplete({
  onSelect,
  defaultValue = '',
  placeholder = 'Enter an address...',
  className = '',
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)
  const [inputValue, setInputValue] = useState(defaultValue)

  // Load Google Places script
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

    if (!apiKey) {
      console.warn('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY not set')
      return
    }

    // Check if already loaded
    if (window.google?.maps?.places) {
      setIsLoaded(true)
      return
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]')
    if (existingScript) {
      existingScript.addEventListener('load', () => setIsLoaded(true))
      return
    }

    // Load the script
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGooglePlaces`
    script.async = true
    script.defer = true

    window.initGooglePlaces = () => {
      setIsLoaded(true)
    }

    document.head.appendChild(script)

    return () => {
      delete window.initGooglePlaces
    }
  }, [])

  // Initialize autocomplete when script is loaded
  useEffect(() => {
    if (!isLoaded || !inputRef.current) return

    // Initialize autocomplete
    autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
      types: ['address'],
      fields: ['address_components', 'formatted_address', 'place_id', 'geometry'],
    })

    // Handle place selection
    autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current?.getPlace()

      if (!place?.address_components) {
        return
      }

      const { city, area } = parseAddressComponents(place.address_components)

      const result: AddressResult = {
        formattedAddress: place.formatted_address || '',
        city,
        area,
        placeId: place.place_id || '',
        lat: place.geometry?.location?.lat(),
        lng: place.geometry?.location?.lng(),
      }

      setInputValue(place.formatted_address || '')
      onSelect(result)
    })
  }, [isLoaded, onSelect])

  // Use my location button handler
  const handleUseMyLocation = useCallback(async () => {
    if (!isLoaded || !navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser')
      return
    }

    setIsLoadingLocation(true)

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        })
      })

      const { latitude, longitude } = position.coords

      // Reverse geocode to get address
      const geocoder = new window.google.maps.Geocoder()
      const response = await geocoder.geocode({
        location: { lat: latitude, lng: longitude },
      })

      if (response.results && response.results.length > 0) {
        const place = response.results[0]
        const { city, area } = parseAddressComponents(place.address_components)

        const result: AddressResult = {
          formattedAddress: place.formatted_address,
          city,
          area,
          placeId: place.place_id,
          lat: latitude,
          lng: longitude,
        }

        setInputValue(place.formatted_address)
        onSelect(result)

        // Bias autocomplete to this location
        if (autocompleteRef.current) {
          const circle = new window.google.maps.Circle({
            center: { lat: latitude, lng: longitude },
            radius: 50000, // 50km
          })
          autocompleteRef.current.setBounds(circle.getBounds()!)
        }
      }
    } catch (error) {
      console.error('Error getting location:', error)
      toast.error('Unable to get your location. Please enter an address manually.')
    } finally {
      setIsLoadingLocation(false)
    }
  }, [isLoaded, onSelect])

  // Handle manual input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
  }

  return (
    <div className={`address-autocomplete ${className}`}>
      <div style={{ position: 'relative' }}>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          style={{
            width: '100%',
            padding: '10px 14px',
            paddingRight: '44px',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            fontSize: '0.95rem',
            outline: 'none',
          }}
          disabled={!isLoaded}
        />
        <button
          type="button"
          onClick={handleUseMyLocation}
          disabled={!isLoaded || isLoadingLocation}
          title="Use my location"
          style={{
            position: 'absolute',
            right: '4px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'transparent',
            border: 'none',
            padding: '8px',
            cursor: isLoaded && !isLoadingLocation ? 'pointer' : 'not-allowed',
            color: isLoaded ? '#64748b' : '#cbd5e1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '4px',
          }}
        >
          {isLoadingLocation ? (
            <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
          ) : (
            <MapPin size={18} />
          )}
        </button>
      </div>
      {!isLoaded && (
        <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '4px' }}>
          Loading address autocomplete...
        </p>
      )}
      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  )
}

export type { AddressResult }
