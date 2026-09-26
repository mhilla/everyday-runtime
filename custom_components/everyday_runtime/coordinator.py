"""Keeps the shopping list and the needs report fresh."""

from __future__ import annotations

from dataclasses import dataclass
import logging
from typing import Any

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import ConfigEntryAuthFailed
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator, UpdateFailed

from .api import EverydayApi, EverydayAuthError, EverydayError
from .const import DOMAIN, SCAN_INTERVAL

_LOGGER = logging.getLogger(__name__)

type EverydayConfigEntry = ConfigEntry[EverydayCoordinator]


@dataclass
class EverydayData:
    """One snapshot of the household."""

    shopping_list: dict[str, Any]
    needs: dict[str, Any]


class EverydayCoordinator(DataUpdateCoordinator[EverydayData]):
    """Polls /s/list and /s/needs."""

    config_entry: EverydayConfigEntry

    def __init__(self, hass: HomeAssistant, entry: EverydayConfigEntry, api: EverydayApi) -> None:
        super().__init__(
            hass, _LOGGER, config_entry=entry, name=DOMAIN, update_interval=SCAN_INTERVAL
        )
        self.api = api

    async def _async_update_data(self) -> EverydayData:
        try:
            shopping_list = await self.api.get_list()
            needs = await self.api.get_needs()
        except EverydayAuthError as err:
            raise ConfigEntryAuthFailed(str(err)) from err
        except EverydayError as err:
            raise UpdateFailed(str(err)) from err
        return EverydayData(shopping_list=shopping_list, needs=needs)

    async def async_change_list(self, payload: dict[str, Any]) -> None:
        """Apply one list change and show its result right away."""
        result = await self.api.update_list(payload)
        if self.data is not None and isinstance(result.get("list"), dict):
            self.async_set_updated_data(EverydayData(shopping_list=result["list"], needs=self.data.needs))
        await self.async_request_refresh()
