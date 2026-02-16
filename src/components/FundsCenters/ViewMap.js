import React, { useState, useEffect, useRef } from 'react';
import Globe from 'react-globe.gl';
import fundsCenterService from '../../services/fundsCenterService';
import './ViewMap.css';

const ViewMap = () => {
  const [fundsCenters, setFundsCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCenter, setSelectedCenter] = useState(null);
  const [isRotating, setIsRotating] = useState(true);
  const globeEl = useRef();

  useEffect(() => {
    loadFundsCenters();
  }, []);

  useEffect(() => {
    if (globeEl.current && selectedCenter) {
      const coords = getCenterCoordinates(selectedCenter.name);
      globeEl.current.pointOfView({ lat: coords.lat, lng: coords.lng, altitude: 2 }, 1000);
    }
  }, [selectedCenter]);

  // Enable/disable auto-rotation
  useEffect(() => {
    if (globeEl.current && !loading) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        if (globeEl.current) {
          const controls = globeEl.current.controls();
          if (controls) {
            controls.autoRotate = isRotating;
            controls.autoRotateSpeed = 1.0; // Rotation speed (adjust as needed)
            controls.enableZoom = true;
            controls.enablePan = true;
            controls.enableRotate = true;
          }
        }
      }, 100);
    }
  }, [loading, isRotating]);

  const toggleRotation = () => {
    setIsRotating(!isRotating);
  };

  const loadFundsCenters = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fundsCenterService.getAllFundsCenters();
      if (response.success && response.data) {
        setFundsCenters(response.data);
      } else {
        setFundsCenters([]);
      }
    } catch (err) {
      setError('Failed to load funds centers');
      console.error('Error loading funds centers:', err);
      setFundsCenters([]);
    } finally {
      setLoading(false);
    }
  };

  // Get coordinates for funds centers
  const getCenterCoordinates = (centerName) => {
    const coordinates = {
      'Colombo': { lat: 6.9271, lng: 79.8612, city: 'Colombo' },
      'New York': { lat: 40.7589, lng: -73.9851, city: 'New York' },
      'Chicago': { lat: 41.8781, lng: -87.6298, city: 'Chicago' },
      'London': { lat: 51.5155, lng: -0.0906, city: 'London' },
      'Tokyo': { lat: 35.6812, lng: 139.7671, city: 'Tokyo' },
      'Singapore': { lat: 1.2897, lng: 103.8501, city: 'Singapore' },
      'Hong Kong': { lat: 22.3193, lng: 114.1694, city: 'Hong Kong' },
      'Dubai': { lat: 25.2048, lng: 55.2708, city: 'Dubai' },
      'Sydney': { lat: -33.8688, lng: 151.2093, city: 'Sydney' },
      'Mumbai': { lat: 19.0760, lng: 72.8777, city: 'Mumbai' },
      'Frankfurt': { lat: 50.1109, lng: 8.6821, city: 'Frankfurt' },
    };

    // Try to find match by city name
    for (const [key, value] of Object.entries(coordinates)) {
      if (centerName.includes(key)) {
        return value;
      }
    }

    // Default to Colombo if not found
    return {
      lat: 6.9271,
      lng: 79.8612,
      city: centerName.split('(')[0].trim()
    };
  };

  // Prepare points data for the globe (dots for each fund center)
  const pointsData = fundsCenters.map((center) => {
    const coords = getCenterCoordinates(center.name);
    const isSelected = selectedCenter?.id === center.id;
    return {
      ...center,
      lat: coords.lat,
      lng: coords.lng,
      color: isSelected ? '#eab308' : '#14b8a6',
      radius: isSelected ? 0.6 : 0.45,
    };
  });

  if (loading) {
    return (
      <div className="vm-container">
        <div className="vm-loading">
          <div className="vm-loading-spinner"></div>
          <p>Loading 3D globe...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="vm-container">
      {/* Rotation Control Button */}
      <button 
        className="vm-rotation-control"
        onClick={toggleRotation}
        title={isRotating ? 'Pause rotation' : 'Play rotation'}
      >
        {isRotating ? (
          <svg className="vm-control-icon" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"/>
          </svg>
        ) : (
          <svg className="vm-control-icon" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"/>
          </svg>
        )}
      </button>
      
      <div className="vm-map-container">
        <div className="vm-globe-wrapper" style={{ width: '100%', height: '100%' }}>
          <Globe
            ref={globeEl}
            globeImageUrl="https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
            backgroundImageUrl="https://unpkg.com/three-globe/example/img/night-sky.png"
            showAtmosphere={true}
            atmosphereColor="#3b82f6"
            atmosphereAltitude={0.15}
            enablePointerInteraction={true}
            animateIn={true}
            pointsData={pointsData}
            pointLat="lat"
            pointLng="lng"
            pointColor={(d) => d.color}
            pointRadius={(d) => d.radius}
            pointAltitude={0.01}
            pointResolution={12}
            onPointClick={(point) => setSelectedCenter(point)}
          />
        </div>
      </div>

      {/* Info Panel */}
      {selectedCenter && (
        <div className="vm-info-panel">
          <div className="vm-info-header">
            <h3>{selectedCenter.name}</h3>
            <button
              className="vm-info-close"
              onClick={() => setSelectedCenter(null)}
            >
              ×
            </button>
          </div>
          <div className="vm-info-content">
            {selectedCenter.flag && selectedCenter.flag !== '0' && selectedCenter.flag !== 0 && (
              <div className="vm-info-row">
                <span className="vm-info-label">Flag:</span>
                <span className="vm-info-value">{selectedCenter.flag}</span>
              </div>
            )}
            {getCenterCoordinates(selectedCenter.name).city && (
              <div className="vm-info-row">
                <span className="vm-info-label">Location:</span>
                <span className="vm-info-value">{getCenterCoordinates(selectedCenter.name).city}</span>
              </div>
            )}
            <div className="vm-info-row">
              <span className="vm-info-label">Coordinates:</span>
              <span className="vm-info-value">
                {getCenterCoordinates(selectedCenter.name).lat.toFixed(4)}, {getCenterCoordinates(selectedCenter.name).lng.toFixed(4)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewMap;
