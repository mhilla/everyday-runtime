"""The Alexa-list bridge example moves items into Everyday (Local To-do stands in for Alexa's list)."""

from __future__ import annotations

from pathlib import Path

import yaml

from homeassistant.core import HomeAssistant
from homeassistant.setup import async_setup_component
from pytest_homeassistant_custom_component.common import MockConfigEntry
from pytest_homeassistant_custom_component.test_util.aiohttp import AiohttpClientMocker

from .conftest import LIST, URL

EXAMPLE = Path(__file__).parent.parent / "examples" / "alexa_list_to_everyday.yaml"


async def test_items_move_from_alexa_list(
    hass: HomeAssistant, aioclient_mock: AiohttpClientMocker, server, entry, tmp_path
) -> None:
    aioclient_mock.post(f"{URL}/s/list/items", json={"ok": True, "message": "added", "list": LIST})
    assert await async_setup_component(hass, "homeassistant", {})
    assert await hass.config_entries.async_setup(entry.entry_id)

    alexa = MockConfigEntry(domain="local_todo", title="Alexa Shopping List", data={"todo_list_name": "Alexa Shopping List", "storage_key": "alexa_shopping_list"})
    alexa.add_to_hass(hass)
    hass.config.config_dir = str(tmp_path)
    (tmp_path / ".storage").mkdir()
    assert await hass.config_entries.async_setup(alexa.entry_id)
    await hass.async_block_till_done()
    assert hass.states.get("todo.alexa_shopping_list") is not None

    package = yaml.safe_load(EXAMPLE.read_text())
    assert await async_setup_component(hass, "automation", {"automation": package["automation"]})
    await hass.async_block_till_done()

    await hass.services.async_call(
        "todo", "add_item", {"entity_id": "todo.alexa_shopping_list", "item": "Hafermilch"}, blocking=True
    )
    await hass.async_block_till_done()

    posted = [call[2] for call in aioclient_mock.mock_calls if call[0] == "POST"]
    assert posted == [{"action": "add", "name": "Hafermilch"}]
    assert hass.states.get("todo.alexa_shopping_list").state == "0"
