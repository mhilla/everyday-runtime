"""Small client for the Everyday Runtime HTTP routes of a Twenty workspace."""

from __future__ import annotations

import asyncio
from typing import Any

import aiohttp

from .const import REQUEST_TIMEOUT


class EverydayError(Exception):
    """The server could not be reached or answered with an error."""


class EverydayAuthError(EverydayError):
    """The API key was rejected."""


class EverydayApi:
    """Calls /s/list, /s/needs and /s/talk with a Twenty API key."""

    def __init__(self, session: aiohttp.ClientSession, url: str, api_key: str) -> None:
        self._session = session
        self._base = url.rstrip("/")
        self._headers = {"Authorization": f"Bearer {api_key}"}

    async def _request(self, method: str, path: str, payload: dict[str, Any] | None = None) -> dict[str, Any]:
        try:
            async with asyncio.timeout(REQUEST_TIMEOUT):
                response = await self._session.request(
                    method, f"{self._base}/s{path}", headers=self._headers, json=payload
                )
                if response.status in (401, 403):
                    raise EverydayAuthError("The API key was rejected")
                if response.status >= 400:
                    raise EverydayError(f"{method} /s{path} failed with HTTP {response.status}")
                data = await response.json(content_type=None)
        except (aiohttp.ClientError, TimeoutError, ValueError) as err:
            raise EverydayError(f"{method} /s{path} failed: {err}") from err
        if not isinstance(data, dict):
            raise EverydayError(f"{method} /s{path} returned no JSON object")
        return data

    async def get_list(self) -> dict[str, Any]:
        """Open items and what was checked off in the last 7 days."""
        return await self._request("GET", "/list")

    async def get_needs(self) -> dict[str, Any]:
        """What the household probably needs, with confidence and reason."""
        return await self._request("GET", "/needs")

    async def update_list(self, payload: dict[str, Any]) -> dict[str, Any]:
        """Add, complete, reopen or remove one item; returns the new list."""
        result = await self._request("POST", "/list/items", payload)
        if not result.get("ok"):
            raise EverydayError(str(result.get("error") or "The list could not be changed"))
        return result

    async def talk(self, text: str) -> dict[str, Any]:
        """One sentence in ("Milch ist leer"), the app's answer out."""
        return await self._request("POST", "/talk", {"text": text})
