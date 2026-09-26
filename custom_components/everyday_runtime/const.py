"""Constants for the Everyday Runtime integration."""

from datetime import timedelta

DOMAIN = "everyday_runtime"

CONF_URL = "url"

SCAN_INTERVAL = timedelta(minutes=5)
REQUEST_TIMEOUT = 30

SERVICE_TALK = "talk"
ATTR_TEXT = "text"
ATTR_CONFIG_ENTRY_ID = "config_entry_id"

MAX_NEEDED_IN_ATTRIBUTES = 20
