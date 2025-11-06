
"use client"
import { useEffect, useState } from "react";
const LOCATION_STORAGE_KEY = "user_location";
const LOCATION_EXPIRY_DAYS = 20;
const getStoredLocation = () => {
    const storedData = localStorage.getItem(LOCATION_STORAGE_KEY);
    if (!storedData) {
        console.log('📍 No stored location found');
        return null;
    }
    const parsedData = JSON.parse(storedData);
    const expiryTime = LOCATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000; // 20days
    const age = Date.now() - parsedData.timestamp;
    const isExpired = age > expiryTime;

    return isExpired ? null : parsedData;
};


const useLocationTracking = () => {
    const [location, setLocation] = useState<{ country: string; city: string | null; timestamp?: number } | null>(getStoredLocation());

    useEffect(() => {
        if(location) return;
        fetch("https://ipapi.co/json/")
            .then(response => response.json())
            .then(data => {
                const newLocation = { country: data.country, city: data.city, timestamp: Date.now() };
                localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(newLocation));
                setLocation(newLocation);
            })
            .catch(error => {
                console.error("❌ Error fetching location data:", error);
            });
    }, []);

    return location;
};

export default useLocationTracking;
