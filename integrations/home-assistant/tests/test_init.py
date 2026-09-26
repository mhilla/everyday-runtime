"""Setup, sensors, the to-do list and the talk action."""

from __future__ import annotations

from homeassistant.config_entries import ConfigEntryState
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import HomeAssistantError
import pytest
from pytest_homeassistant_custom_component.common import MockConfigEntry
from pytest_homeassistant_custom_component.test_util.aiohttp import AiohttpClientMocker

from custom_components.everyday_runtime.const import DOMAIN

from .conftest import LIST, NEEDS, URL

TODO = "todo.everyday_shopping_list"


async def setup(hass: HomeAssistant, entry: MockConfigEntry) -> None:
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()


async def test_sensors_and_list(hass: HomeAssistant, server, entry: MockConfigEntry) -> None:
    await setup(hass, entry)
    assert entry.state is ConfigEntryState.LOADED

    needed = hass.states.get("sensor.everyday_probably_needed")
    assert needed.state == "2"
    assert needed.attributes["not_on_list"] == ["Eier"]
    assert needed.attributes["items"][0] == {
        "name": "Milch",
        "status": "Probably low",
        "need_percent": 86,
        "is_estimate": True,
        "reason": "last purchased 6 days ago",
        "on_list": True,
    }
    assert hass.states.get("sensor.everyday_on_the_list").state == "2"
    assert hass.states.get(TODO).state == "2"

    result = await hass.services.async_call(
        "todo", "get_items", {"entity_id": TODO}, blocking=True, return_response=True
    )
    items = result[TODO]["items"]
    assert [(item["summary"], item["status"]) for item in items] == [
        ("Milch", "needs_action"),
        ("Brot", "needs_action"),
        ("Kaffee", "completed"),
    ]
    assert items[0]["description"] == "2 l · üblicher Abstand ~5 Tage"


async def test_bad_key_starts_reauth(hass: HomeAssistant, aioclient_mock: AiohttpClientMocker, entry) -> None:
    aioclient_mock.get(f"{URL}/s/list", status=401)
    await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    assert entry.state is ConfigEntryState.SETUP_ERROR
    assert any(flow["context"]["source"] == "reauth" for flow in hass.config_entries.flow.async_progress())


async def test_unreachable_server_retries(hass: HomeAssistant, aioclient_mock: AiohttpClientMocker, entry) -> None:
    aioclient_mock.get(f"{URL}/s/list", status=502)
    await hass.config_entries.async_setup(entry.entry_id)
    assert entry.state is ConfigEntryState.SETUP_RETRY


@pytest.mark.parametrize(
    ("service", "data", "payload"),
    [
        ("add_item", {"item": "2 Milch"}, {"action": "add", "name": "2 Milch"}),
        ("update_item", {"item": "item-bread", "status": "completed"}, {"action": "complete", "id": "item-bread"}),
        ("update_item", {"item": "item-coffee", "status": "needs_action"}, {"action": "reopen", "id": "item-coffee"}),
        ("remove_item", {"item": "item-milk"}, {"action": "remove", "id": "item-milk"}),
    ],
)
async def test_list_changes_are_sent(
    hass: HomeAssistant, aioclient_mock: AiohttpClientMocker, server, entry, service, data, payload
) -> None:
    aioclient_mock.post(f"{URL}/s/list/items", json={"ok": True, "message": "done", "list": LIST})
    await setup(hass, entry)

    await hass.services.async_call("todo", service, {"entity_id": TODO, **data}, blocking=True)

    posted = [call for call in aioclient_mock.mock_calls if call[0] == "POST"]
    assert len(posted) == 1
    assert posted[0][2] == payload
    assert posted[0][3]["Authorization"] == "Bearer secret"


async def test_rename_is_refused(hass: HomeAssistant, server, entry) -> None:
    await setup(hass, entry)
    with pytest.raises(HomeAssistantError, match="renaming"):
        await hass.services.async_call(
            "todo", "update_item", {"entity_id": TODO, "item": "item-bread", "rename": "Vollkornbrot"}, blocking=True
        )


async def test_server_error_is_shown(hass: HomeAssistant, aioclient_mock: AiohttpClientMocker, server, entry) -> None:
    aioclient_mock.post(f"{URL}/s/list/items", json={"ok": False, "error": "No such item on the list."})
    await setup(hass, entry)
    with pytest.raises(HomeAssistantError, match="No such item"):
        await hass.services.async_call(
            "todo", "update_item", {"entity_id": TODO, "item": "item-bread", "status": "completed"}, blocking=True
        )


async def test_talk_returns_the_reply(hass: HomeAssistant, aioclient_mock: AiohttpClientMocker, server, entry) -> None:
    aioclient_mock.post(
        f"{URL}/s/talk",
        json={"ok": True, "intent": "EMPTY", "language": "de", "changed": True, "reply": "Alles klar — Milch ist alle und steht auf der Liste."},
    )
    await setup(hass, entry)

    response = await hass.services.async_call(
        DOMAIN, "talk", {"text": "Milch ist leer"}, blocking=True, return_response=True
    )

    assert response == {
        "reply": "Alles klar — Milch ist alle und steht auf der Liste.",
        "understood": True,
        "intent": "EMPTY",
        "changed": True,
    }
    talk_call = next(call for call in aioclient_mock.mock_calls if str(call[1]).endswith("/s/talk"))
    assert talk_call[2] == {"text": "Milch ist leer"}


async def test_unload(hass: HomeAssistant, server, entry) -> None:
    await setup(hass, entry)
    assert await hass.config_entries.async_unload(entry.entry_id)
    assert entry.state is ConfigEntryState.NOT_LOADED
