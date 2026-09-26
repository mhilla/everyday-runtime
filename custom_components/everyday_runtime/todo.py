"""The Everyday shopping list as a Home Assistant to-do list."""

from __future__ import annotations

from homeassistant.components.todo import (
    TodoItem,
    TodoItemStatus,
    TodoListEntity,
    TodoListEntityFeature,
)
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from .api import EverydayError
from .coordinator import EverydayConfigEntry
from .entity import EverydayEntity


async def async_setup_entry(
    hass: HomeAssistant,
    entry: EverydayConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    """Set up the shopping list."""
    async_add_entities([EverydayShoppingList(entry.runtime_data, "shopping_list")])


def _description(item: dict) -> str | None:
    amount = f"{item.get('quantity')} {item.get('unit') or ''}".strip()
    parts = [part for part in (amount, item.get("reason")) if part]
    return " · ".join(parts) or None


class EverydayShoppingList(EverydayEntity, TodoListEntity):
    """Checking an item off records a purchase in Everyday."""

    _attr_supported_features = (
        TodoListEntityFeature.CREATE_TODO_ITEM
        | TodoListEntityFeature.UPDATE_TODO_ITEM
        | TodoListEntityFeature.DELETE_TODO_ITEM
        | TodoListEntityFeature.SET_DESCRIPTION_ON_ITEM
    )

    def _items(self) -> list[dict]:
        if self.coordinator.data is None:
            return []
        return list(self.coordinator.data.shopping_list.get("items", []))

    @property
    def todo_items(self) -> list[TodoItem]:
        return [
            TodoItem(
                uid=item["id"],
                summary=item["name"],
                description=_description(item),
                status=TodoItemStatus.COMPLETED if item["status"] == "PURCHASED" else TodoItemStatus.NEEDS_ACTION,
            )
            for item in self._items()
        ]

    async def _change(self, payload: dict) -> None:
        try:
            await self.coordinator.async_change_list(payload)
        except EverydayError as err:
            raise HomeAssistantError(f"Everyday Runtime: {err}") from err

    async def async_create_todo_item(self, item: TodoItem) -> None:
        await self._change({"action": "add", "name": item.summary})

    async def async_update_todo_item(self, item: TodoItem) -> None:
        current = next((entry for entry in self._items() if entry["id"] == item.uid), None)
        if current is None:
            raise HomeAssistantError("Everyday Runtime: this item is no longer on the list")
        if item.summary is not None and item.summary != current["name"]:
            raise HomeAssistantError("Everyday Runtime: renaming items is not supported yet; add a new one instead")
        was_done = current["status"] == "PURCHASED"
        if item.status == TodoItemStatus.COMPLETED and not was_done:
            await self._change({"action": "complete", "id": item.uid})
        elif item.status == TodoItemStatus.NEEDS_ACTION and was_done:
            await self._change({"action": "reopen", "id": item.uid})

    async def async_delete_todo_items(self, uids: list[str]) -> None:
        for uid in uids:
            await self._change({"action": "remove", "id": uid})
