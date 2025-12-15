'use client';
import React, { useState, useEffect } from 'react';
import {
    ComposableMap,
    Geographies,
    Geography,
}   from '@vnedyalk0v/react19-simple-maps';

import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';

// URL to the world map topology data
const geoUrl = '/countries-110m.json';

// Updated data with ISO A3 codes to map with geography data
const geographicalData = [
    { id: '840', name: 'USA', users: 4500, sellers: 120 }, // United States of America
    { id: '826', name: 'United Kingdom', users: 2800, sellers: 85 },
    { id: '276', name: 'Germany', users: 2200, sellers: 68 },
    { id: '250', name: 'France', users: 1900, sellers: 52 },
    { id: '124', name: 'Canada', users: 1600, sellers: 45 },
    { id: '036', name: 'Australia', users: 1400, sellers: 38 },
    { id: '392', name: 'Japan', users: 1200, sellers: 32 },
    // The 'Others' category cannot be represented on a specific country and has been omitted.
];

// Color constants for easier maintenance
const COLOR_DATA = '#6366f1'; // Color for countries with data
const COLOR_NO_DATA = '#374151'; // Color for countries without data
const COLOR_HOVER = '#f59e0b'; // Color on hover
const COLOR_STROKE = '#1f2937'; // Country border color

const GeographicalMap = () => {
    const [geoData, setGeoData] = useState(null);

    // Tối ưu hiệu năng: Chuyển mảng dữ liệu thành Map để tra cứu nhanh (O(1))
    // React.useMemo đảm bảo việc này chỉ chạy một lần.
    const dataMap = React.useMemo(
        () => new Map(geographicalData.map((item) => [item.id, item])),
        []
    );

    useEffect(() => {
        // Fetch the geography data on the client side after the component mounts
        fetch(geoUrl)
            .then((res) => res.json())
            .then(setGeoData);
    }, []);

    // Render a loading state while the map data is being fetched on the client.
    if (!geoData) {
        return <div>Loading map...</div>;
    }

    return (
        <>
            <ComposableMap
                projectionConfig={{
                    scale: 140,
                }}
                style={{ width: '100%', height: 'auto' }}
                data-tooltip-id="country-tooltip"
            >
                <Geographies geography={geoData}>
                    {({ geographies }) =>
                        geographies.map((geo, i) => {
                            // Tra cứu dữ liệu quốc gia từ Map.
                            const d = dataMap.get(geo.id);
                            const countryName = geo.properties?.name || 'Unknown';

                            return (
                                <Geography
                                    key={`geography-${i}`}
                                    geography={geo}
                                    data-tooltip-id="country-tooltip"
                                    data-tooltip-html={d 
                                        ? `<strong>${countryName}</strong><br />Users: ${d.users}<br />Sellers: ${d.sellers}`
                                        : `<strong>${countryName}</strong><br />No data available`
                                    }
                                    style={{
                                        default: {
                                            fill: d ? COLOR_DATA : COLOR_NO_DATA,
                                            stroke: COLOR_STROKE,
                                            strokeWidth: 0.5,
                                            outline: 'none',
                                        },
                                        hover: {
                                            fill: COLOR_HOVER,
                                            outline: 'none',
                                            cursor: 'pointer',
                                        },
                                        pressed: {
                                            fill: COLOR_HOVER,
                                            outline: 'none',
                                        },
                                    }}
                                />
                            );
                        })
                    }
                </Geographies>
            </ComposableMap>
            <Tooltip
                id="country-tooltip"
                float={true}
                style={{
                    backgroundColor: '#1a1a1a',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                }}
            />
        </>
    );
};

export default GeographicalMap;