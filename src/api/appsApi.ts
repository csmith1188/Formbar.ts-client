import { http } from "./HTTPApi";

export function getAppById(id: number) {
	return http(`/apps/${id}`);
}