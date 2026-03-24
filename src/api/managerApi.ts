import { http } from "./HTTPApi";

export function getManagerData(offset?: number, limit?: number, sortBy?: string) {
    const params = new URLSearchParams();

    if (offset !== undefined) {
        params.set("offset", String(offset));
    }

    if (limit !== undefined) {
        params.set("limit", String(limit));
    }

    if (sortBy !== undefined) {
        params.set("sortBy", sortBy);
    }
    
    const query = params.toString();
    const url = query ? `/manager?${query}` : "/manager";
    return http(url);
}

export function deleteIpFromList(whitelist: boolean, ipId: number) {
    return http(`/ip/${whitelist ? 'whitelist' : 'blacklist'}/${ipId}`, "DELETE");
}

export function getIpAccessList(whitelist: boolean) {
    return http(`/ip/${whitelist ? 'whitelist' : 'blacklist'}`);
}

export function toggleIpList(whitelist: boolean) {
    return http(`/ip/${whitelist ? 'whitelist' : 'blacklist'}/toggle`, "POST");
}

export function updateIpFromList(whitelist: boolean, ipId: string, ip: string) {
    return http(`/ip/${whitelist ? 'whitelist' : 'blacklist'}/${ipId}`, "PUT", {}, { ip });
}

export function addIpToList(whitelist: boolean, ip: string) {
    return http(`/ip/${whitelist ? 'whitelist' : 'blacklist'}`, "POST", {}, { ip });
}