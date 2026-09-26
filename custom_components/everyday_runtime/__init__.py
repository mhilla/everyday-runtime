"""Everyday Runtime: your self-hosted shopping assistant in Home Assistant."""

from __future__ import annotations

import voluptuous as vol

from homeassistant.config_entries import ConfigEntryState
from homeassistant.const import CONF_API_KEY, Platform
from homeassistant.core import HomeAssistant, ServiceCall, ServiceResponse, SupportsResponse
from homeassistant.exceptions import HomeAssistantError, ServiceValidationError
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from homeassistant.helpers.typing import ConfigType

from .api import EverydayApi, EverydayError
from .const import ATTR_CONFIG_ENTRY_ID, ATTR_TEXT, CONF_URL, DOMAIN, SERVICE_TALK
from .coordinator import EverydayConfigEntry, EverydayCoordinator

PLATFORMS = [Platform.SENSOR, Platform.TODO]

CONFIG_SCHEMA = cv.config_entry_only_config_schema(DOMAIN)

TALK_SCHEMA = vol.Schema(
    {
        vol.Required(ATTR_TEXT): vol.All(cv.string, vol.Length(min=1, max=500)),
        vol.Optional(ATTR_CONFIG_ENTRY_ID): cv.string,
    }
)


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Register the talk action once for all households."""

    async def talk(call: ServiceCall) -> ServiceResponse:
        entries = [
            entry
            for entry in hass.config_entries.async_entries(DOMAIN)
            if entry.state is ConfigEntryState.LOADED
            and entry.entry_id == call.data.get(ATTR_CONFIG_ENTRY_ID, entry.entry_id)
        ]
        if not entries:
            raise ServiceValidationError("No Everyday Runtime household is set up")
        coordinator: EverydayCoordinator = entries[0].runtime_data
        try:
            result = await coordinator.api.talk(call.data[ATTR_TEXT])
        except EverydayError as err:
            raise HomeAssistantError(f"Everyday Runtime: {err}") from err
        if result.get("changed"):
            await coordinator.async_request_refresh()
        return {
            "reply": result.get("reply") or result.get("error") or "",
            "understood": bool(result.get("ok")),
            "intent": result.get("intent"),
            "changed": bool(result.get("changed")),
        }

    hass.services.async_register(
        DOMAIN, SERVICE_TALK, talk, schema=TALK_SCHEMA, supports_response=SupportsResponse.OPTIONAL
    )
    return True


async def async_setup_entry(hass: HomeAssistant, entry: EverydayConfigEntry) -> bool:
    """Connect to one Twenty workspace."""
    api = EverydayApi(async_get_clientsession(hass), entry.data[CONF_URL], entry.data[CONF_API_KEY])
    coordinator = EverydayCoordinator(hass, entry, api)
    await coordinator.async_config_entry_first_refresh()
    entry.runtime_data = coordinator
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    return True


async def async_unload_entry(hass: HomeAssistant, entry: EverydayConfigEntry) -> bool:
    """Disconnect."""
    return await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
