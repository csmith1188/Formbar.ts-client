import { http } from "@api/HTTPApi";

export function getItemRegistry() {
	return http("/items");
}

export function getItemByID(itemId: number) {
	return http(`/item/${itemId}`);
}

// GET /user/{id}/inventory
export function getUserInventory(id: string) {
	return http(`/user/${id}/inventory`, "GET");
}

// DELETE /user/{id}/inventory/{itemId}
export function deleteInventoryItem(
	userId: string,
	itemId: number,
	quantity: number = 1,
) {
	return http(
		`/user/${userId}/inventory/${itemId}`,
		"DELETE",
		{},
		{ quantity },
	);
}
