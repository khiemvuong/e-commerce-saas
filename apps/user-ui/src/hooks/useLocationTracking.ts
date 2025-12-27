"use client"
import { useEffect, useState } from "react";

const LOCATION_STORAGE_KEY = "user-location-v1";
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
        fetch("https://api.ipdata.co/?api-key=55a764f51128c7d0c2c73e8f9ad969003ac6362999287dbbc8cacdd6", {
            headers: {
                "Accept": "application/json"
            }
        })
            .then(async (response) => {
                if (!response.ok) throw new Error("Network response was not ok");
                return response.json();
            })
            .then(data => {
                const newLocation = { 
                    country: data.country_name || data.country || "Unknown", 
                    city: data.city || "Unknown", 
                    timestamp: Date.now() 
                };
                localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(newLocation));
                setLocation(newLocation);
                console.log('✅ New location saved:', newLocation);
            })
            .catch(async (error) => {
                console.warn("⚠️ Primary location API failed, trying fallback...", error);
                try {
                    // Fallback API: ipwho.is
                    const fallbackRes = await fetch("https://ipwho.is/");
                    if (!fallbackRes.ok) throw new Error("Fallback network response not ok");
                    
                    const fallbackData = await fallbackRes.json();
                    
                    if (fallbackData.success === false) {
                        throw new Error(fallbackData.message || "Fallback API Error");
                    }

                    const newLocation = { 
                        country: fallbackData.country || "Unknown", 
                        city: fallbackData.city || "Unknown", 
                        timestamp: Date.now() 
                    };
                    localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(newLocation));
                    setLocation(newLocation);
                } catch (fallbackError) {
                    console.error("❌ All location APIs failed:", fallbackError);
                    setLocation({ country: "Unknown", city: "Unknown", timestamp: Date.now() });
                }
            });
    }, []);

    return location;
};

export default useLocationTracking;