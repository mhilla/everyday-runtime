"""The Assist examples in integrations/home-assistant/examples really work."""

from __future__ import annotations

from pathlib import Path
import shutil

import pytest
import yaml

from homeassistant.components import conversation
from homeassistant.core import Context, HomeAssistant
from homeassistant.setup import async_setup_component
from pytest_homeassistant_custom_component.test_util.aiohttp import AiohttpClientMocker

from .conftest import URL

EXAMPLES = Path(__file__).parent.parent / "examples"


@pytest.fixture
async def voice(hass: HomeAssistant, server, entry, aioclient_mock: AiohttpClientMocker):
    """Everyday + the example package + custom sentences, like a real config."""
    shutil.copytree(EXAMPLES / "custom_sentences", Path(hass.config.path("custom_sentences")), dirs_exist_ok=True)
    package = yaml.safe_load((EXAMPLES / "everyday_voice.yaml").read_text())
    assert await async_setup_component(hass, "homeassistant", {})
    assert await async_setup_component(hass, "conversation", {})
    assert await async_setup_component(hass, "intent_script", {"intent_script": package["intent_script"]})
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    aioclient_mock.post(f"{URL}/s/talk", json={"ok": True, "changed": False, "reply": "Antwort von Everyday"})
    return aioclient_mock


@pytest.mark.parametrize(
    ("language", "said", "sent"),
    [
        ("de", "Milch ist leer", "Milch ist leer"),
        ("de", "wir haben keine Eier mehr", "Eier ist leer"),
        ("de", "ich habe Kaffee gekauft", "Kaffee gekauft"),
        ("de", "haben wir noch Butter", "Haben wir noch Butter?"),
        ("de", "was brauchen wir", "Was brauchen wir?"),
        ("en", "we're out of milk", "We are out of milk"),
        ("en", "I bought coffee", "Bought coffee"),
        ("en", "do we have eggs", "Do we have eggs?"),
        ("en", "what do we need", "What do we need?"),
    ],
)
async def test_sentence_reaches_everyday(hass: HomeAssistant, voice, language, said, sent) -> None:
    result = await conversation.async_converse(hass, said, None, Context(), language=language)

    speech = result.response.speech["plain"]["speech"]
    assert speech == "Antwort von Everyday"
    talk = [call for call in voice.mock_calls if str(call[1]).endswith("/s/talk")]
    assert [call[2] for call in talk] == [{"text": sent}]
