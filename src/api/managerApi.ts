import { http } from "./HTTPApi";

export function getManagerData(offset: number = 0, limit: number = 20, sortBy: string) {
    return http(`/manager${limit > -1 && offset > -1 && sortBy ? `?limit=${limit}&offset=${offset}&sortBy=${sortBy}` : ''}`);
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