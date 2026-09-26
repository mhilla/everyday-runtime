"""Shared fixtures: a mocked Twenty server with one shopping list."""

from __future__ import annotations

import copy
from typing import Any

import pytest

from homeassistant.const import CONF_API_KEY
from homeassistant.core import HomeAssistant
from pytest_homeassistant_custom_component.common import MockConfigEntry
from pytest_homeassistant_custom_component.test_util.aiohttp import AiohttpClientMocker

from custom_components.everyday_runtime.const import CONF_URL, DOMAIN

URL = "https://twenty.example.com"

LIST = {
    "generatedAt": "2026-09-26T12:00:00.000Z",
    "openCount": 2,
    "items": [
        {"id": "item-milk", "name": "Milch", "quantity": 2, "unit": "l", "status": "OPEN", "suggested": True, "reason": "üblicher Abstand ~5 Tage", "updatedAt": "2026-09-25T12:00:00.000Z"},
        {"id": "item-bread", "name": "Brot", "quantity": 1, "unit": None, "status": "OPEN", "suggested": False, "reason": None, "updatedAt": "2026-09-26T08:00:00.000Z"},
        {"id": "item-coffee", "name": "Kaffee", "quantity": 1, "unit": "Pck.", "status": "PURCHASED", "suggested": False, "reason": None, "updatedAt": "2026-09-24T12:00:00.000Z"},
    ],
}

NEEDS = {
    "generatedAt": "2026-09-26T12:00:00.000Z",
    "count": 2,
    "needed": [
        {"productId": "p-milk", "name": "Milch", "state": "LIKELY", "needScore": 0.86, "confidence": 0.7, "label": "Probably low", "isEstimate": True, "reason": "last purchased 6 days ago", "onList": True},
        {"productId": "p-eggs", "name": "Eier", "state": "POSSIBLE", "needScore": 0.55, "confidence": 0.5, "label": "Might be low", "isEstimate": True, "reason": "usual interval ~9 days", "onList": False},
    ],
}


@pytest.fixture(autouse=True)
def auto_enable_custom_integrations(enable_custom_integrations):
    """Load custom_components/ in every test."""
    yield


@pytest.fixture
def server(aioclient_mock: AiohttpClientMocker) -> dict[str, Any]:
    """Serve /s/list, /s/needs, /s/list/items and /s/talk from state."""
    state = {"list": copy.deepcopy(LIST), "needs": copy.deepcopy(NEEDS), "posted": []}
    aioclient_mock.get(f"{URL}/s/list", json=state["list"])
    aioclient_mock.get(f"{URL}/s/needs", json=state["needs"])
    return state


@pytest.fixture
def entry(hass: HomeAssistant) -> MockConfigEntry:
    """A configured household."""
    config_entry = MockConfigEntry(
        domain=DOMAIN,
        title="Everyday",
        unique_id=URL,
        data={CONF_URL: URL, CONF_API_KEY: "secret"},
    )
    config_entry.add_to_hass(hass)
    return config_entry
