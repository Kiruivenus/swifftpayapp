/**
 * Geo Lookup Utility
 * Uses ip-api.com for IP-based geolocation.
 */

export interface GeoLocation {
    country: string;
    countryCode: string;
    city: string;
    lat: number;
    lon: number;
}

export async function lookupIp(ip: string): Promise<GeoLocation | null> {
    if (!ip || ip === '::1' || ip === '127.0.0.1') {
        return {
            country: 'Local',
            countryCode: 'LO',
            city: 'Development',
            lat: 0,
            lon: 0
        };
    }

    try {
        // Using common free API (Note: Non-commercial use)
        const res = await fetch(`http://ip-api.com/json/${ip}`);
        const data = await res.json();

        if (data.status === 'success') {
            return {
                country: data.country,
                countryCode: data.countryCode,
                city: data.city,
                lat: data.lat,
                lon: data.lon
            };
        }
    } catch (err) {
        console.error('Geo lookup failed:', err);
    }

    return null;
}
