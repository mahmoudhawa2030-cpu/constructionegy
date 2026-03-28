"use client";

import { Capacitor } from "@capacitor/core";
import type { Map as LeafletMap, LayerGroup } from "leaflet";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { CategoryOption } from "@/lib/categories/queries";
import { tryOpenAndroidLocationSettings } from "@/lib/capacitor/try-open-location-settings";
import { getPrecisePosition } from "@/lib/geolocation/precise-position";
import { haversineKm } from "@/lib/map/haversine";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/database.types";

import "leaflet/dist/leaflet.css";

type UserType = Database["public"]["Enums"]["user_type"];

type PinRow = {
  user_id: string;
  lat: number;
  lng: number;
  available_until: string;
  category_slug: string | null;
  profiles: { full_name: string; user_type: UserType } | null;
};

function categoryMenuLabel(c: CategoryOption, locale: string): string {
  if (locale === "ar") return c.label_ar;
  const s = c.slug.replace(/_/g, " ");
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : c.slug;
}

const LIVE_SESSION_MS = 2 * 60 * 60 * 1000;
const HEARTBEAT_MS = 90_000;
const POLL_MS = 35_000;
const DEFAULT_CENTER: [number, number] = [26.82, 30.8];
const DEFAULT_ZOOM = 6;
/** Matches OSM; caps map max zoom for flyTo “maximum”. */
const MAP_MAX_ZOOM = 19;
/** Seconds for flyTo animation when centering on GPS. */
const LOCATE_FLY_DURATION_SEC = 1.55;

const LOCATE_CONTROL_BTN_SVG = `<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="display:block"><circle cx="12" cy="12" fill="none" r="7" stroke="#93c5fd" stroke-width="2"/><circle cx="12" cy="12" fill="#2563eb" r="3"/></svg>`;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function availabilityIso(): string {
  return new Date(Date.now() + LIVE_SESSION_MS).toISOString();
}

function postgrestMessage(e: unknown): string | undefined {
  if (!e || typeof e !== "object") return undefined;
  const o = e as Record<string, unknown>;
  if (typeof o.message === "string" && o.message.length > 0) return o.message;
  return undefined;
}

type Props = {
  userId: string;
  categories: CategoryOption[];
  /** When false, map is view-only: no “Available now” / heartbeat (matches RLS). */
  canUseLiveMap: boolean;
};

export function LiveMapClient({ userId, categories, canUseLiveMap }: Props) {
  const t = useTranslations("mapPage");
  const locale = useLocale();
  const supabase = useMemo(() => createClient(), []);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const groupRef = useRef<LayerGroup | null>(null);
  const leafletRef = useRef<typeof import("leaflet") | null>(null);

  const [pins, setPins] = useState<PinRow[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveErrorDetail, setSaveErrorDetail] = useState<string | null>(null);
  const [viewerPos, setViewerPos] = useState<{ lat: number; lng: number } | null>(null);
  const [filterCategorySlug, setFilterCategorySlug] = useState("");
  const [liveCategorySlug, setLiveCategorySlug] = useState("");
  const liveCategorySlugRef = useRef("");
  liveCategorySlugRef.current = liveCategorySlug;

  const [myLocationBusy, setMyLocationBusy] = useState(false);
  const [locateMapError, setLocateMapError] = useState<"geoPermission" | "locationServicesOff" | "geoFailed" | null>(
    null,
  );

  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const categoriesInitializedRef = useRef(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const myLocationHandlerRef = useRef<() => void>(() => {});
  const locateLeafletBtnRef = useRef<HTMLButtonElement | null>(null);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!canUseLiveMap) stopHeartbeat();
  }, [canUseLiveMap, stopHeartbeat]);

  useEffect(() => {
    if (categories.length === 0 || categoriesInitializedRef.current) return;
    setLiveCategorySlug((prev) => prev || categories[0]!.slug);
    categoriesInitializedRef.current = true;
  }, [categories]);

  const fetchPins = useCallback(async () => {
    const nowIso = new Date().toISOString();
    let q = supabase
      .from("live_map_pins")
      .select("user_id, lat, lng, available_until, category_slug, profiles(full_name, user_type)")
      .gt("available_until", nowIso);
    if (filterCategorySlug) {
      q = q.eq("category_slug", filterCategorySlug);
    }
    const { data, error: qErr } = await q;

    if (qErr) {
      console.error("[live_map_pins]", qErr);
      return;
    }
    setPins((data ?? []) as PinRow[]);
  }, [supabase, filterCategorySlug]);

  const syncOwnRowState = useCallback(async () => {
    const { data: own } = await supabase.from("live_map_pins").select("*").eq("user_id", userId).maybeSingle();
    if (!own) {
      setIsLive(false);
      setViewerPos(null);
      return;
    }
    if (new Date(own.available_until) <= new Date()) {
      await supabase.from("live_map_pins").delete().eq("user_id", userId);
      setIsLive(false);
      setViewerPos(null);
      return;
    }
    setIsLive(true);
    setViewerPos({ lat: own.lat, lng: own.lng });
    if (own.category_slug) {
      setLiveCategorySlug(own.category_slug);
    }
  }, [supabase, userId]);

  const upsertPin = useCallback(
    async (lat: number, lng: number, categorySlug: string | null) => {
      const until = availabilityIso();
      const row = {
        user_id: userId,
        lat,
        lng,
        available_until: until,
        updated_at: new Date().toISOString(),
        category_slug: categorySlug && categorySlug.length > 0 ? categorySlug : null,
      };
      // Delete-then-insert avoids some PostgREST upsert + RLS edge cases.
      const { error: delErr } = await supabase.from("live_map_pins").delete().eq("user_id", userId);
      if (delErr) throw delErr;
      const { error: insErr } = await supabase.from("live_map_pins").insert(row);
      if (insErr) throw insErr;
      setViewerPos({ lat, lng });
      setIsLive(true);
      void fetchPins();
    },
    [fetchPins, supabase, userId],
  );

  useEffect(() => {
    void syncOwnRowState();
    void fetchPins();
  }, [fetchPins, syncOwnRowState]);

  useEffect(() => {
    pollRef.current = setInterval(() => {
      void fetchPins();
    }, POLL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchPins]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || mapRef.current) return;

    let cancelled = false;
    import("leaflet").then((L) => {
      if (cancelled || !containerRef.current) return;
      leafletRef.current = L;
      const map = L.map(containerRef.current, { zoomControl: true, maxZoom: MAP_MAX_ZOOM }).setView(
        DEFAULT_CENTER,
        DEFAULT_ZOOM,
      );
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: MAP_MAX_ZOOM,
      }).addTo(map);
      const group = L.layerGroup().addTo(map);

      const LocateControl = L.Control.extend({
        onAdd: () => {
          const container = L.DomUtil.create("div", "leaflet-bar leaflet-control");
          const btn = L.DomUtil.create("button", "", container) as HTMLButtonElement;
          btn.type = "button";
          btn.innerHTML = LOCATE_CONTROL_BTN_SVG;
          btn.style.width = "30px";
          btn.style.height = "30px";
          btn.style.padding = "0";
          btn.style.margin = "0";
          btn.style.display = "flex";
          btn.style.alignItems = "center";
          btn.style.justifyContent = "center";
          btn.style.background = "#fff";
          btn.style.color = "#333";
          btn.style.border = "none";
          btn.style.lineHeight = "30px";
          btn.style.cursor = "pointer";
          L.DomEvent.disableClickPropagation(container);
          L.DomEvent.on(btn, "click", L.DomEvent.stopPropagation);
          L.DomEvent.on(btn, "click", L.DomEvent.preventDefault);
          L.DomEvent.on(btn, "click", () => {
            myLocationHandlerRef.current();
          });
          locateLeafletBtnRef.current = btn;
          return container;
        },
        onRemove: () => {
          locateLeafletBtnRef.current = null;
        },
      });
      // Stacked under default zoom +/- (same `topleft` corner).
      new LocateControl({ position: "topleft" }).addTo(map);

      mapRef.current = map;
      groupRef.current = group;
      setMapReady(true);
      requestAnimationFrame(() => map.invalidateSize());
    });

    return () => {
      cancelled = true;
      locateLeafletBtnRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
      groupRef.current = null;
      leafletRef.current = null;
      setMapReady(false);
    };
  }, []);

  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    const group = groupRef.current;
    if (!mapReady || !L || !map || !group) return;

    group.clearLayers();

    const greenHtml =
      '<div style="width:12px;height:12px;border-radius:9999px;background:#22c55e;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.35)"></div>';
    const blueHtml =
      '<div style="width:12px;height:12px;border-radius:9999px;background:#2563eb;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.35)"></div>';

    const bounds: [number, number][] = [];

    for (const pin of pins) {
      const isSelf = pin.user_id === userId;
      const icon = L.divIcon({
        className: "live-map-marker-wrap",
        html: isSelf ? blueHtml : greenHtml,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });

      const pr = pin.profiles;
      const name = pr?.full_name ?? "—";
      const typeKey = pr?.user_type === "supplier" ? "supplier" : "contractor";
      const typeLabel = t(typeKey);
      const profileUrl = `/profile/${pin.user_id}`;
      const catOpt = pin.category_slug ? categories.find((c) => c.slug === pin.category_slug) : undefined;
      const categoryLine = catOpt
        ? `<div style="font-size:12px;margin-top:2px;opacity:0.9">${escapeHtml(categoryMenuLabel(catOpt, locale))}</div>`
        : "";

      let distanceLine = "";
      if (viewerPos && !isSelf) {
        const km = haversineKm(viewerPos.lat, viewerPos.lng, pin.lat, pin.lng);
        distanceLine = `<div style="margin-top:4px;font-size:12px;opacity:0.85">${escapeHtml(t("distanceKm", { km: km < 10 ? km.toFixed(1) : Math.round(km).toString() }))}</div>`;
      }

      const popupHtml = `<div style="min-width:10rem">
        <strong>${escapeHtml(name)}</strong>
        <div style="font-size:12px;margin-top:2px;opacity:0.9">${escapeHtml(typeLabel)}</div>
        ${categoryLine}
        ${distanceLine}
        <div style="margin-top:6px"><a href="${profileUrl}" style="color:#2563eb;font-weight:600">${escapeHtml(t("profileLink"))}</a></div>
      </div>`;

      L.marker([pin.lat, pin.lng], { icon }).bindPopup(popupHtml).addTo(group);
      bounds.push([pin.lat, pin.lng]);
    }

    if (bounds.length === 1) {
      map.setView(bounds[0]!, 12);
    } else if (bounds.length > 1) {
      map.fitBounds(bounds, { padding: [36, 36], maxZoom: 14 });
    }

    requestAnimationFrame(() => map.invalidateSize());
  }, [categories, locale, mapReady, pins, t, userId, viewerPos]);

  const startLive = useCallback(async () => {
    if (!canUseLiveMap) return;
    setBusy(true);
    setError(null);
    try {
      if (categories.length > 0 && !liveCategorySlugRef.current.trim()) {
        setError("categoryRequired");
        return;
      }

      // Android: show Google Play “Location accuracy” system sheet when needed (same UX as other map apps).
      if (Capacitor.getPlatform() === "android") {
        const { LocationAccuracy } = await import("@/lib/capacitor/location-accuracy");
        await LocationAccuracy.requestHighAccuracySheet();
      }

      const { lat, lng } = await getPrecisePosition();
      const cat = liveCategorySlugRef.current.trim() || null;
      await upsertPin(lat, lng, cat);
      stopHeartbeat();
      heartbeatRef.current = setInterval(() => {
        void (async () => {
          try {
            const next = await getPrecisePosition();
            await upsertPin(next.lat, next.lng, liveCategorySlugRef.current.trim() || null);
          } catch (e) {
            console.error("[live map heartbeat]", e);
          }
        })();
      }, HEARTBEAT_MS);
    } catch (e: unknown) {
      console.error("[live map start]", e);
      setSaveErrorDetail(null);
      const msg =
        postgrestMessage(e) ?? (e instanceof Error ? e.message : undefined);

      if (e instanceof Error && e.message === "permission_denied") {
        setError("geoPermission");
      } else if (
        (e instanceof Error && e.message === "location_services_disabled") ||
        (msg && /location services are not enabled/i.test(msg))
      ) {
        // Android: system Location (GPS) master switch is off — apps cannot turn it on for you.
        setError("locationServicesOff");
      } else {
        if (msg) setSaveErrorDetail(msg);

        const hasPostgrestCode =
          typeof e === "object" &&
          e !== null &&
          "code" in e &&
          typeof (e as { code?: unknown }).code === "string";

        if (msg && /not implemented on web|geolocation_unavailable/i.test(msg)) {
          setError("geoFailed");
        } else if (
          msg &&
          (/does not exist|relation|schema cache|live_map_pins/i.test(msg) ||
            (hasPostgrestCode && String((e as { code?: string }).code) === "PGRST205"))
        ) {
          setError("errorSaveMigration");
        } else if (hasPostgrestCode) {
          setError("errorSave");
        } else {
          setError("geoFailed");
        }
      }
    } finally {
      setBusy(false);
    }
  }, [canUseLiveMap, categories.length, stopHeartbeat, upsertPin]);

  const onAvailableClick = useCallback(() => {
    setError(null);
    setSaveErrorDetail(null);
    void startLive();
  }, [startLive]);

  const onMyLocationClick = useCallback(async () => {
    const map = mapRef.current;
    if (!map || myLocationBusy) return;
    setMyLocationBusy(true);
    setLocateMapError(null);
    try {
      const { lat, lng } = await getPrecisePosition();
      const maxZ =
        typeof map.getMaxZoom === "function" && Number.isFinite(map.getMaxZoom())
          ? map.getMaxZoom()
          : MAP_MAX_ZOOM;
      map.flyTo([lat, lng], maxZ, {
        duration: LOCATE_FLY_DURATION_SEC,
        easeLinearity: 0.2,
      });
      requestAnimationFrame(() => map.invalidateSize());
    } catch (e: unknown) {
      const msg =
        postgrestMessage(e) ?? (e instanceof Error ? e.message : undefined);
      if (e instanceof Error && e.message === "permission_denied") {
        setLocateMapError("geoPermission");
      } else if (
        (e instanceof Error && e.message === "location_services_disabled") ||
        (msg && /location services are not enabled/i.test(msg))
      ) {
        setLocateMapError("locationServicesOff");
      } else {
        setLocateMapError("geoFailed");
      }
    } finally {
      setMyLocationBusy(false);
    }
  }, [myLocationBusy]);

  myLocationHandlerRef.current = () => {
    void onMyLocationClick();
  };

  useEffect(() => {
    const btn = locateLeafletBtnRef.current;
    if (!mapReady || !btn) return;
    btn.setAttribute("aria-label", myLocationBusy ? t("locating") : t("myLocationAria"));
    if (myLocationBusy) btn.setAttribute("aria-busy", "true");
    else btn.removeAttribute("aria-busy");
    btn.disabled = myLocationBusy;
  }, [mapReady, myLocationBusy, locale, t]);

  const onCloseLive = useCallback(async () => {
    setBusy(true);
    setError(null);
    setSaveErrorDetail(null);
    stopHeartbeat();
    await supabase.from("live_map_pins").delete().eq("user_id", userId);
    setIsLive(false);
    setViewerPos(null);
    setBusy(false);
    void fetchPins();
  }, [fetchPins, stopHeartbeat, supabase, userId]);

  useEffect(() => {
    return () => {
      stopHeartbeat();
    };
  }, [stopHeartbeat]);

  const liveCategoryLabel =
    liveCategorySlug && categories.length > 0
      ? categoryMenuLabel(
          categories.find((c) => c.slug === liveCategorySlug) ?? {
            slug: liveCategorySlug,
            label_ar: liveCategorySlug,
          },
          locale,
        )
      : liveCategorySlug;

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col">
      <div className="shrink-0 border-b border-zinc-200 px-1.5 py-0.5 dark:border-zinc-800 sm:px-3 sm:py-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 sm:justify-between">
          <h1 className="shrink-0 text-sm font-semibold text-zinc-900 dark:text-zinc-50 sm:text-base">{t("title")}</h1>
          <div className="flex min-w-0 flex-1 basis-[12rem] flex-wrap items-center gap-1.5 sm:justify-end">
            <select
              aria-label={t("filterCategoryAria")}
              className="min-w-0 max-w-[min(100%,18rem)] rounded-lg border border-zinc-300 bg-white px-2 py-1 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
              value={filterCategorySlug}
              onChange={(e) => setFilterCategorySlug(e.target.value)}
            >
              <option value="">{t("filterAllCategories")}</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {categoryMenuLabel(c, locale)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {!canUseLiveMap ? (
          <div
            className="mt-1 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1.5 text-xs dark:border-amber-800 dark:bg-amber-950/40 sm:text-sm"
            role="status"
          >
            <p className="text-amber-950 dark:text-amber-100">{t("subscriptionRequiredBanner")}</p>
            <Link
              aria-label={t("subscriptionRequiredLinkAria")}
              className="mt-1 inline-block font-medium text-amber-900 underline hover:no-underline dark:text-amber-200"
              href="/subscription-required?feature=live_map"
            >
              {t("subscriptionRequiredCta")}
            </Link>
          </div>
        ) : null}

        <div className="mt-0.5 flex flex-wrap items-center gap-1.5 sm:mt-1">
          {!isLive ? (
            <>
              <select
                aria-label={t("liveCategoryAria")}
                className="max-w-[min(100%,16rem)] rounded-lg border border-zinc-300 bg-white px-2 py-1 text-sm text-zinc-900 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
                disabled={categories.length === 0 || busy || !canUseLiveMap}
                value={liveCategorySlug}
                onChange={(e) => setLiveCategorySlug(e.target.value)}
              >
                {categories.length === 0 ? (
                  <option value="">{t("noCategories")}</option>
                ) : (
                  categories.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {categoryMenuLabel(c, locale)}
                    </option>
                  ))
                )}
              </select>
              <button
                className="rounded-lg bg-emerald-600 px-2.5 py-1 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
                disabled={busy || categories.length === 0 || !canUseLiveMap}
                onClick={onAvailableClick}
                type="button"
              >
                {busy ? t("locating") : t("availableNow")}
              </button>
            </>
          ) : (
            <>
              <button
                className="rounded-lg border border-zinc-300 bg-white px-2.5 py-1 text-sm font-semibold text-zinc-900 shadow-sm hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
                disabled={busy}
                onClick={() => void onCloseLive()}
                type="button"
              >
                {t("closeLive")}
              </button>
              {liveCategoryLabel ? (
                <span className="text-xs text-zinc-600 dark:text-zinc-400">{t("liveAsCategory", { category: liveCategoryLabel })}</span>
              ) : null}
            </>
          )}
          <Link className="text-xs font-medium text-blue-600 hover:underline sm:text-sm dark:text-blue-400" href="/profile">
            {t("myProfile")}
          </Link>
        </div>
        {error === "categoryRequired" ? (
          <p className="mt-1 text-xs text-amber-700 dark:text-amber-300 sm:text-sm">{t("errorCategoryRequired")}</p>
        ) : null}
        {error === "geoPermission" ? (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400 sm:text-sm">{t("errorGeolocationPermission")}</p>
        ) : null}
        {error === "locationServicesOff" ? (
          <div className="mt-1 space-y-1.5 sm:mt-2 sm:space-y-2">
            <p className="text-sm font-medium text-red-600 dark:text-red-400">{t("errorLocationServicesOff")}</p>
            <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">{t("errorLocationServicesOffHint")}</p>
            {Capacitor.getPlatform() === "android" ? (
              <button
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
                onClick={() => tryOpenAndroidLocationSettings()}
                type="button"
              >
                {t("openLocationSettings")}
              </button>
            ) : null}
          </div>
        ) : null}
        {error === "geoFailed" ? (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400 sm:text-sm">{t("errorGeolocation")}</p>
        ) : null}
        {error === "errorSave" ? (
          <div className="mt-1 space-y-1 sm:mt-2">
            <p className="text-xs text-red-600 dark:text-red-400 sm:text-sm">{t("errorSave")}</p>
            {saveErrorDetail ? (
              <p className="break-all font-mono text-xs text-red-600/90 dark:text-red-400/90">{saveErrorDetail}</p>
            ) : null}
          </div>
        ) : null}
        {error === "errorSaveMigration" ? (
          <div className="mt-1 space-y-1 sm:mt-2">
            <p className="text-xs text-red-600 dark:text-red-400 sm:text-sm">{t("errorSaveMigration")}</p>
            {saveErrorDetail ? (
              <p className="break-all font-mono text-xs text-red-600/90 dark:text-red-400/90">{saveErrorDetail}</p>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* Explicit min-height: nested flex from Next + dynamic import often yields flex-1 height 0 — Leaflet needs pixels. */}
      <div
        className="relative w-full flex-1 bg-zinc-100 dark:bg-zinc-900 min-h-[max(18rem,calc(100dvh-9rem))] md:min-h-[max(18rem,calc(100dvh-13rem))]"
        ref={containerRef}
      >
        {!mapReady ? (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-zinc-500">{t("loadingMap")}</div>
        ) : null}
        {mapReady ? (
          <>
            {pins.length === 0 ? (
              <p className="pointer-events-none absolute bottom-12 start-2 end-2 z-[300] text-center text-xs leading-snug text-zinc-600 dark:text-zinc-400 sm:bottom-14 sm:text-sm">
                {filterCategorySlug ? t("noPinsInCategory") : t("noPins")}
              </p>
            ) : null}
            {locateMapError ? (
              <div
                className="absolute start-2 end-2 bottom-2 z-[401] rounded-lg border border-zinc-200 bg-white/95 p-2 text-center text-xs shadow-lg dark:border-zinc-600 dark:bg-zinc-950/95"
                role="alert"
              >
                {locateMapError === "geoPermission" ? (
                  <p className="text-red-600 dark:text-red-400">{t("errorGeolocationPermission")}</p>
                ) : null}
                {locateMapError === "locationServicesOff" ? (
                  <div className="space-y-2">
                    <p className="font-medium text-red-600 dark:text-red-400">{t("errorLocationServicesOff")}</p>
                    <p className="leading-relaxed text-zinc-600 dark:text-zinc-400">{t("errorLocationServicesOffHint")}</p>
                    {Capacitor.getPlatform() === "android" ? (
                      <button
                        className="rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-xs font-medium text-zinc-900 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
                        onClick={() => tryOpenAndroidLocationSettings()}
                        type="button"
                      >
                        {t("openLocationSettings")}
                      </button>
                    ) : null}
                  </div>
                ) : null}
                {locateMapError === "geoFailed" ? (
                  <p className="text-red-600 dark:text-red-400">{t("errorGeolocation")}</p>
                ) : null}
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}
