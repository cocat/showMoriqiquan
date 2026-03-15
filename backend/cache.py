"""
缓存封装：优先 Redis，失败时回退到进程内 TTL 缓存。
"""
import json
import os
import threading
import time
from typing import Any, Optional

try:
    from redis import Redis
except Exception:  # pragma: no cover - 依赖缺失时回退内存缓存
    Redis = None  # type: ignore


class _MemoryTTLCache:
    def __init__(self):
        self._store: dict[str, tuple[float, str]] = {}
        self._lock = threading.Lock()

    def get(self, key: str) -> Optional[str]:
        now = time.time()
        with self._lock:
            item = self._store.get(key)
            if not item:
                return None
            expires_at, value = item
            if expires_at <= now:
                self._store.pop(key, None)
                return None
            return value

    def set(self, key: str, value: str, ttl_seconds: int) -> None:
        if ttl_seconds <= 0:
            return
        with self._lock:
            self._store[key] = (time.time() + ttl_seconds, value)


class CacheClient:
    def __init__(self):
        self._prefix = os.getenv("CACHE_PREFIX", "moriqiquan:")
        self._memory = _MemoryTTLCache()
        self._redis = None

        redis_url = os.getenv("REDIS_URL", "").strip()
        if redis_url and Redis is not None:
            try:
                self._redis = Redis.from_url(redis_url, decode_responses=True)
                self._redis.ping()
            except Exception:
                self._redis = None

    def _k(self, key: str) -> str:
        return f"{self._prefix}{key}"

    def get_json(self, key: str) -> Optional[Any]:
        full_key = self._k(key)
        raw = None

        if self._redis is not None:
            try:
                raw = self._redis.get(full_key)
            except Exception:
                raw = None

        if raw is None:
            raw = self._memory.get(full_key)

        if not raw:
            return None

        try:
            return json.loads(raw)
        except Exception:
            return None

    def set_json(self, key: str, value: Any, ttl_seconds: int) -> None:
        if ttl_seconds <= 0:
            return

        full_key = self._k(key)
        payload = json.dumps(value, ensure_ascii=False, separators=(",", ":"))

        if self._redis is not None:
            try:
                self._redis.setex(full_key, ttl_seconds, payload)
                return
            except Exception:
                pass

        self._memory.set(full_key, payload, ttl_seconds)


cache_client = CacheClient()
