import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Icon, DivIcon } from 'leaflet';
import { getMapLocations } from '../services/api';
import { translateTerm } from '../services/translate';

// Custom icons for different location types
const createIcon = (color: string, emoji: string) => new DivIcon({
    className: 'custom-div-icon',
    html: `<div style="
        background-color: ${color};
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        border: 2px solid white;
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
    ">${emoji}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
});

const icons = {
    'Processing Unit': createIcon('#6366f1', '🏭'),
    'Shop': createIcon('#10b981', '🏪'),
    'Farmer': createIcon('#f59e0b', '🌾'),
};

// Fallback icon
const defaultIcon = new Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

interface MapLocation {
    id: string;
    name: string;
    type: 'Processing Unit' | 'Shop' | 'Farmer';
    lat: number;
    lng: number;
    location: string;
    contact_email?: string;
    contact_phone?: string;
}

interface MapSummary {
    processing_units: { total: number; geocoded: number };
    shops: { total: number; geocoded: number };
    farmers: { total: number; geocoded: number };
}

function SupplyChainMap() {
    const [locations, setLocations] = useState<MapLocation[]>([]);
    const [summary, setSummary] = useState<MapSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [visibleTypes, setVisibleTypes] = useState<string[]>(['Processing Unit', 'Shop', 'Farmer']);

    // Center on Tanzania
    const center = [-6.3690, 34.8888] as [number, number];

    useEffect(() => {
        const fetchLocations = async () => {
            try {
                setLoading(true);
                const response = await getMapLocations();
                setLocations(response.data.locations || []);
                setSummary(response.data.summary || null);
                setError(null);
            } catch (err) {
                console.error('Failed to fetch map locations:', err);
                setError('Failed to load map locations');
                // Use empty array on error
                setLocations([]);
            } finally {
                setLoading(false);
            }
        };

        fetchLocations();
        // Refresh every 5 minutes
        const interval = setInterval(fetchLocations, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const getIcon = (type: string) => {
        return icons[type as keyof typeof icons] || defaultIcon;
    };

    const toggleType = (type: string) => {
        setVisibleTypes(prev =>
            prev.includes(type)
                ? prev.filter(t => t !== type)
                : [...prev, type]
        );
    };

    const filteredLocations = locations.filter(loc => visibleTypes.includes(loc.type));

    return (
        <div style={{ position: 'relative' }}>
            {/* Legend / Filter */}
            <div style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                zIndex: 1000,
                background: 'white',
                padding: '12px 16px',
                borderRadius: '12px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                fontSize: '13px',
                minWidth: '200px',
            }}>
                <div style={{ fontWeight: 600, marginBottom: '12px', color: '#1f2937', borderBottom: '1px solid #f3f4f6', paddingBottom: '8px' }}>
                    Map Filters
                </div>

                <label style={{ display: 'flex', alignItems: 'center', marginBottom: '8px', cursor: 'pointer', userSelect: 'none' }}>
                    <input
                        type="checkbox"
                        checked={visibleTypes.includes('Farmer')}
                        onChange={() => toggleType('Farmer')}
                        style={{ marginRight: '10px', width: '16px', height: '16px', accentColor: '#f59e0b' }}
                    />
                    <span style={{ marginRight: '8px' }}>🌾</span>
                    <span>Abattoirs {summary && <span style={{ color: '#666', fontSize: '11px' }}>({summary.farmers.geocoded}/{summary.farmers.total})</span>}</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', marginBottom: '8px', cursor: 'pointer', userSelect: 'none' }}>
                    <input
                        type="checkbox"
                        checked={visibleTypes.includes('Processing Unit')}
                        onChange={() => toggleType('Processing Unit')}
                        style={{ marginRight: '10px', width: '16px', height: '16px', accentColor: '#6366f1' }}
                    />
                    <span style={{ marginRight: '8px' }}>🏭</span>
                    <span>Processing Units {summary && <span style={{ color: '#666', fontSize: '11px' }}>({summary.processing_units.geocoded}/{summary.processing_units.total})</span>}</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}>
                    <input
                        type="checkbox"
                        checked={visibleTypes.includes('Shop')}
                        onChange={() => toggleType('Shop')}
                        style={{ marginRight: '10px', width: '16px', height: '16px', accentColor: '#10b981' }}
                    />
                    <span style={{ marginRight: '8px' }}>🏪</span>
                    <span>Shops {summary && <span style={{ color: '#666', fontSize: '11px' }}>({summary.shops.geocoded}/{summary.shops.total})</span>}</span>
                </label>
            </div>

            {/* Loading overlay */}
            {loading && (
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 1000,
                    background: 'rgba(255,255,255,0.9)',
                    padding: '20px 30px',
                    borderRadius: '8px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                }}>
                    Loading map data...
                </div>
            )}

            {/* Error message */}
            {error && !loading && (
                <div style={{
                    position: 'absolute',
                    bottom: '10px',
                    left: '10px',
                    zIndex: 1000,
                    background: '#fee2e2',
                    color: '#dc2626',
                    padding: '10px 15px',
                    borderRadius: '8px',
                    fontSize: '12px',
                }}>
                    {error}
                </div>
            )}

            {/* No data message */}
            {!loading && !error && locations.length === 0 && (
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 1000,
                    background: 'rgba(255,255,255,0.95)',
                    padding: '20px 30px',
                    borderRadius: '8px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                    textAlign: 'center',
                }}>
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>📍</div>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>No locations available</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                        Locations will appear when entities are registered with valid addresses
                    </div>
                </div>
            )}

            <div style={{ height: '500px', width: '100%', borderRadius: '12px', overflow: 'hidden' }}>
                <MapContainer center={center} zoom={6} style={{ height: '100%', width: '100%' }}>
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    {filteredLocations.map((loc) => (
                        <Marker
                            key={loc.id}
                            position={[loc.lat, loc.lng] as [number, number]}
                            icon={getIcon(loc.type)}
                        >
                            <Popup>
                                <div style={{ minWidth: '150px' }}>
                                    <strong style={{ fontSize: '14px' }}>{loc.name}</strong>
                                    <div style={{
                                        fontSize: '11px',
                                        color: '#666',
                                        marginTop: '4px',
                                        padding: '2px 6px',
                                        background: '#f3f4f6',
                                        borderRadius: '4px',
                                        display: 'inline-block'
                                    }}>
                                        {translateTerm(loc.type)}
                                    </div>
                                    {loc.location && (
                                        <div style={{ marginTop: '8px', fontSize: '12px' }}>
                                            📍 {loc.location}
                                        </div>
                                    )}
                                    {loc.contact_email && (
                                        <div style={{ marginTop: '4px', fontSize: '12px' }}>
                                            ✉️ {loc.contact_email}
                                        </div>
                                    )}
                                    {loc.contact_phone && (
                                        <div style={{ marginTop: '4px', fontSize: '12px' }}>
                                            📞 {loc.contact_phone}
                                        </div>
                                    )}
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>
            </div>
        </div>
    );
}

export default SupplyChainMap;
