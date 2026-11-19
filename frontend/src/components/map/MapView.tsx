import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  MapContainer,
  Marker,
  Popup,
  ScaleControl,
  TileLayer,
  ZoomControl,
  useMap,
  useMapEvents,
} from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { HazardReport } from "../../types";
import { HP_CENTER, HP_ZOOM } from "../../utils/constants";
import { formatConfidence, formatDate } from "../../utils/format";
import { HazardBadge, SeverityBadge, StatusBadge } from "../reports/Badges";
import { createClusterIcon, createHazardIcon } from "./markerIcon";

function MapController({
  center,
  zoom,
  fitToReports,
  reportCount,
}: {
  center?: [number, number];
  zoom?: number;
  fitToReports?: boolean;
  reportCount: number;
}) {
  const map = useMap();

  useEffect(() => {
    if (center) {
      map.setView(center, zoom ?? map.getZoom(), { animate: true });
    }
  }, [center?.[0], center?.[1], zoom, map]);

  useEffect(() => {
    if (!fitToReports || reportCount === 0) return;
    const bounds = L.latLngBounds([]);
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        bounds.extend(layer.getLatLng());
      }
    });
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [28, 28], maxZoom: 12 });
    }
  }, [fitToReports, reportCount, map]);

  return null;
}

function ViewportListener({
  onViewportChange,
}: {
  onViewportChange?: (bbox: string, bounds: L.LatLngBounds) => void;
}) {
  const map = useMap();
  useMapEvents({
    moveend: () => {
      if (!onViewportChange) return;
      const bounds = map.getBounds();
      const bbox = [
        bounds.getWest(),
        bounds.getSouth(),
        bounds.getEast(),
        bounds.getNorth(),
      ]
        .map((value) => value.toFixed(6))
        .join(",");
      onViewportChange(bbox, bounds);
    },
  });
  return null;
}

function ClickListener({
  onMapClick,
}: {
  onMapClick?: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click: (event) => {
      onMapClick?.(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

function HazardPopup({ report }: { report: HazardReport }) {
  const image = report.image_urls[0];
  return (
    <div className="min-w-[230px] max-w-[260px]">
      {image && (
        <img
          src={image}
          alt={`Reported ${report.hazard_type.replace(/_/g, " ")}`}
          className="mb-2.5 h-28 w-full rounded-md object-cover"
          loading="lazy"
        />
      )}
      <p className="text-sm font-semibold leading-snug text-ink">{report.title}</p>
      <p className="mt-0.5 text-[11px] text-muted">
        {report.district ?? "District not recorded"} · {formatDate(report.created_at)}
      </p>
      <div className="mt-2 flex flex-wrap gap-1">
        <HazardBadge type={report.hazard_type} showIcon={false} />
        <SeverityBadge severity={report.severity} />
        <StatusBadge status={report.status} />
      </div>
      <div className="mt-2 grid grid-cols-2 gap-1 text-[11px] text-muted">
        <span>AI confidence</span>
        <span className="text-right font-medium text-ink">
          {formatConfidence(report.ai_confidence)}
        </span>
        <span>Coordinates</span>
        <span className="text-right font-medium text-ink">
          {report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}
        </span>
      </div>
      <Link
        to={`/app/reports/${report.id}`}
        className="mt-2.5 block rounded-md bg-brand-700 px-2 py-1.5 text-center text-xs font-semibold text-white hover:bg-brand-800"
      >
        View details
      </Link>
    </div>
  );
}

export interface MapViewProps {
  reports: HazardReport[];
  center?: [number, number];
  zoom?: number;
  selectedId?: string | null;
  onSelect?: (report: HazardReport) => void;
  onViewportChange?: (bbox: string, bounds: L.LatLngBounds) => void;
  onMapClick?: (lat: number, lng: number) => void;
  className?: string;
  interactive?: boolean;
  showPopups?: boolean;
  fitToReports?: boolean;
  showScale?: boolean;
  showZoom?: boolean;
}

export function MapView({
  reports,
  center = HP_CENTER,
  zoom = HP_ZOOM,
  selectedId,
  onSelect,
  onViewportChange,
  onMapClick,
  className = "h-[420px] w-full",
  interactive = true,
  showPopups = true,
  fitToReports = false,
  showScale = true,
  showZoom = true,
}: MapViewProps) {
  const icons = useMemo(
    () =>
      new Map(
        reports.map((report) => [
          report.id,
          createHazardIcon(report, report.id === selectedId),
        ])
      ),
    [reports, selectedId]
  );

  return (
    <div className={className}>
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={interactive}
        dragging={interactive}
        doubleClickZoom={interactive}
        zoomControl={false}
        attributionControl
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapController
          center={center}
          zoom={zoom}
          fitToReports={fitToReports}
          reportCount={reports.length}
        />
        <ViewportListener onViewportChange={onViewportChange} />
        {onMapClick && <ClickListener onMapClick={onMapClick} />}
        {showZoom && <ZoomControl position="bottomright" />}
        {showScale && <ScaleControl position="bottomleft" imperial={false} />}

        <MarkerClusterGroup
          chunkedLoading
          showCoverageOnHover={false}
          spiderfyOnMaxZoom
          maxClusterRadius={48}
          iconCreateFunction={createClusterIcon}
        >
          {reports.map((report) => (
            <Marker
              key={report.id}
              position={[report.latitude, report.longitude]}
              icon={icons.get(report.id)}
              eventHandlers={{
                click: () => onSelect?.(report),
              }}
            >
              {showPopups && (
                <Popup>
                  <HazardPopup report={report} />
                </Popup>
              )}
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
}

export function MapPreview({
  reports,
  center,
  zoom = 8,
  className = "h-56 w-full",
}: {
  reports: HazardReport[];
  center?: [number, number];
  zoom?: number;
  className?: string;
}) {
  return (
    <MapView
      reports={reports}
      center={center}
      zoom={zoom}
      className={className}
      interactive={false}
      showPopups={false}
      fitToReports={!center}
      showScale={false}
      showZoom={false}
    />
  );
}


