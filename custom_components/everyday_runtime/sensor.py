"""Sensors: what is probably needed, and how much is on the list."""

from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass
from typing import Any

from homeassistant.components.sensor import SensorEntity, SensorEntityDescription, SensorStateClass
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from .const import MAX_NEEDED_IN_ATTRIBUTES
from .coordinator import EverydayConfigEntry, EverydayData
from .entity import EverydayEntity


def _needed(data: EverydayData) -> dict[str, Any]:
    return {
        "items": [
            {
                "name": entry.get("name"),
                "status": entry.get("label"),
                "need_percent": round(float(entry.get("needScore") or 0) * 100),
                "is_estimate": entry.get("isEstimate"),
                "reason": entry.get("reason"),
                "on_list": entry.get("onList"),
            }
            for entry in data.needs.get("needed", [])[:MAX_NEEDED_IN_ATTRIBUTES]
        ],
        "not_on_list": [
            entry.get("name") for entry in data.needs.get("needed", []) if not entry.get("onList")
        ],
    }


def _on_list(data: EverydayData) -> dict[str, Any]:
    return {
        "items": [
            item.get("name") for item in data.shopping_list.get("items", []) if item.get("status") == "OPEN"
        ]
    }


@dataclass(frozen=True, kw_only=True)
class EverydaySensorDescription(SensorEntityDescription):
    """Value and attributes of one sensor."""

    value: Callable[[EverydayData], int]
    attributes: Callable[[EverydayData], dict[str, Any]]


SENSORS = (
    EverydaySensorDescription(
        key="probably_needed",
        state_class=SensorStateClass.MEASUREMENT,
        value=lambda data: int(data.needs.get("count", 0)),
        attributes=_needed,
    ),
    EverydaySensorDescription(
        key="on_list",
        state_class=SensorStateClass.MEASUREMENT,
        value=lambda data: int(data.shopping_list.get("openCount", 0)),
        attributes=_on_list,
    ),
)


async def async_setup_entry(
    hass: HomeAssistant,
    entry: EverydayConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    """Set up the sensors."""
    async_add_entities(EverydaySensor(entry.runtime_data, description) for description in SENSORS)


class EverydaySensor(EverydayEntity, SensorEntity):
    """A count with the details as attributes (for cards, templates, notifications)."""

    entity_description: EverydaySensorDescription

    def __init__(self, coordinator, description: EverydaySensorDescription) -> None:
        super().__init__(coordinator, description.key)
        self.entity_description = description

    @property
    def native_value(self) -> int | None:
        if self.coordinator.data is None:
            return None
        return self.entity_description.value(self.coordinator.data)

    @property
    def extra_state_attributes(self) -> dict[str, Any] | None:
        if self.coordinator.data is None:
            return None
        return self.entity_description.attributes(self.coordinator.data)
