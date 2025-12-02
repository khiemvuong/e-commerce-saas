"use client"
import { useEffect, useState } from "react";

const LOCATION_STORAGE_KEY = "user-location";
const LOCATION_EXPIRY_DAYS = 20;

const getStoredLocation = () => {
    if (typeof window === 'undefined') {
        return null;
    }
    
    try {
        const storedData = localStorage.getItem(LOCATION_STORAGE_KEY);
        if (!storedData) {
            console.log('📍 No stored location found');
            return null;
        }
        
        const parsedData = JSON.parse(storedData);
        const expiryTime = LOCATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
        const age = Date.now() - parsedData.timestamp;
        const isExpired = age > expiryTime;

        if (isExpired) {
            console.log('📍 Location data expired');
            localStorage.removeItem(LOCATION_STORAGE_KEY);
            return null;
        }

        return parsedData;
    } catch (error) {
        console.error('❌ Error reading location data:', error);
        localStorage.removeItem(LOCATION_STORAGE_KEY);
        return null;
    }
};

const useLocationTracking = () => {
    const [location, setLocation] = useState<{ country: string; city: string | null; timestamp?: number } | null>(null);

    useEffect(() => {
        // Chỉ chạy trên client-side
        const storedLocation = getStoredLocation();
        
        if (storedLocation) {
            setLocation(storedLocation);
            return;
        }

        // Fetch location mới
        fetch("https://ipapi.co/json/")
            .then(response => response.json())
            .then(data => {
                const newLocation = { 
                    country: data.country, 
                    city: data.city, 
                    timestamp: Date.now() 
                };
                localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(newLocation));
                setLocation(newLocation);
                console.log('✅ New location saved:', newLocation);
            })
            .catch(error => {
                console.error("❌ Error fetching location data:", error);
            });
    }, []);

    return location;
};

export default useLocationTracking;