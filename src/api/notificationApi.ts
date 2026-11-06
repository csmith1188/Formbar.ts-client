import { http } from "@api/HTTPApi";
import { buildPaginationQuery, type PaginationParams } from "@api/pagination";

export function getNotifications({ limit, offset }: PaginationParams = {}) {
	return http(`/notifications${buildPaginationQuery({ limit, offset })}`);
}

export function getNotificationById(notificationId: string) {
	return http(`/notifications/${encodeURIComponent(notificationId)}`);
}

export function markNotificationAsRead(notificationId: string) {
	return http(
		`/notifications/${encodeURIComponent(notificationId)}/mark-read`,
		"POST",
	);
}

export function markNotificationAsUnread(notificationId: string) {
	return http(
		`/notifications/${encodeURIComponent(notificationId)}/mark-unread`,
		"POST",
	);
}

export function deleteAllNotifications() {
	return http("/notifications", "DELETE");
}

export function deleteNotificationById(notificationId: string) {
	return http(
		`/notifications/${encodeURIComponent(notificationId)}`,
		"DELETE",
	);
}
