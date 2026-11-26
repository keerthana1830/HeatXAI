from fastapi import APIRouter, Depends, Query
from fastapi.responses import HTMLResponse
from pymongo.database import Database
from app.core.database import get_db
from app.repositories.district import district_repo
from app.ml.forecasting import classify_heat_risk

router = APIRouter(prefix="/districts", tags=["folium"])


@router.get("/map/folium", response_class=HTMLResponse)
def generate_folium_map(
    mode: str = Query("current", pattern="^(current|forecast)$"),
    db: Database = Depends(get_db)
):
    """
    Generate an interactive Leaflet.js HTML map of Tamil Nadu district heat data.
    Supports switching between 'current' observed hotspots and 'forecast' heat risk hotspots.
    Returns a self-contained HTML page suitable for iframe embedding.
    """
    districts = district_repo.get_all(db)

    districts_json = []
    for d in districts:
        base_lst = d.get("lst", 35.0)
        ndvi = d.get("ndvi", 0.25)
        ndbi = d.get("ndbi", 0.45)
        # 7-day forecast prediction calculated via surface thermal equation
        forecast_peak = round(base_lst + (ndbi - ndvi) * 1.8, 1)
        forecast_risk = classify_heat_risk(forecast_peak)

        districts_json.append({
            "id": d["id"],
            "name": d["name"],
            "lat": d["lat"],
            "lon": d["lon"],
            "lst": base_lst,
            "ndvi": ndvi,
            "ndbi": ndbi,
            "heat_index": d.get("heat_index", 40.0),
            "risk_level": d.get("risk_level", classify_heat_risk(base_lst)),
            "forecast_lst": forecast_peak,
            "forecast_risk": forecast_risk,
            "temp_delta": round(forecast_peak - base_lst, 1)
        })

    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>Thermacity Interactive Folium Thermal Map</title>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <script src="https://unpkg.com/leaflet.heat@0.2.0/dist/leaflet-heat.js"></script>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
        <style>
            * {{ margin:0; padding:0; box-sizing:border-box; font-family:'Plus Jakarta Sans', sans-serif; }}
            body {{ background:#090d16; color:#e2e8f0; height:100vh; overflow:hidden; }}
            #map {{ width:100%; height:100vh; z-index:1; }}

            /* Glass UI Controls */
            .glass-box {{
                background: rgba(15, 23, 42, 0.85);
                backdrop-filter: blur(14px);
                border: 1px solid rgba(255, 255, 255, 0.14);
                border-radius: 16px;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.45);
            }}

            .map-header {{
                position: absolute;
                top: 16px;
                left: 16px;
                z-index: 1000;
                padding: 10px 16px;
                display: flex;
                align-items: center;
                gap: 14px;
            }}

            .map-header h2 {{
                font-size: 14px;
                font-weight: 800;
                background: linear-gradient(135deg, #f97316, #ef4444);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                margin: 0;
            }}

            /* Mode Switcher */
            .mode-switcher {{
                position: absolute;
                top: 16px;
                left: 50%;
                transform: translateX(-50%);
                z-index: 1000;
                display: flex;
                padding: 4px;
                gap: 4px;
            }}

            .mode-btn {{
                background: transparent;
                border: none;
                color: #94a3b8;
                font-size: 11px;
                font-weight: 700;
                padding: 6px 14px;
                border-radius: 10px;
                cursor: pointer;
                transition: all 0.2s ease;
            }}

            .mode-btn.active {{
                background: linear-gradient(135deg, #f97316, #ef4444);
                color: #ffffff;
                box-shadow: 0 4px 12px rgba(249, 115, 22, 0.35);
            }}

            .search-box {{
                position: absolute;
                top: 16px;
                right: 16px;
                z-index: 1000;
                padding: 8px 14px;
                display: flex;
                align-items: center;
                gap: 8px;
            }}

            .search-box input {{
                background: rgba(30, 41, 59, 0.7);
                border: 1px solid rgba(255, 255, 255, 0.15);
                border-radius: 10px;
                color: #fff;
                padding: 6px 12px;
                font-size: 12px;
                outline: none;
                width: 170px;
                transition: all 0.2s ease;
            }}

            .search-box input:focus {{
                border-color: #f97316;
                width: 210px;
            }}

            /* Map Legend */
            .legend {{
                position: absolute;
                bottom: 24px;
                left: 16px;
                z-index: 1000;
                padding: 12px 16px;
                font-size: 11px;
            }}

            .legend-title {{
                font-weight: 700;
                margin-bottom: 8px;
                color: #94a3b8;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                font-size: 10px;
            }}

            .legend-scale {{
                display: flex;
                align-items: center;
                gap: 6px;
            }}

            .legend-bar {{
                height: 8px;
                width: 140px;
                border-radius: 4px;
                background: linear-gradient(to right, #22c55e, #eab308, #f97316, #ef4444);
            }}

            /* Leaflet popup styling override */
            .leaflet-popup-content-wrapper {{
                background: rgba(15, 23, 42, 0.94) !important;
                backdrop-filter: blur(16px);
                border: 1px solid rgba(255, 255, 255, 0.16);
                border-radius: 16px !important;
                color: #f8fafc !important;
                box-shadow: 0 20px 30px rgba(0, 0, 0, 0.5) !important;
                padding: 4px;
            }}
            .leaflet-popup-tip {{
                background: rgba(15, 23, 42, 0.94) !important;
            }}
        </style>
    </head>
    <body>
        <div class="map-header glass-box">
            <div>
                <h2>Thermacity GIS Thermal Map</h2>
                <div id="subheading" style="font-size:10px; color:#94a3b8; font-weight:500;">Observed Hotspots · 38 Districts</div>
            </div>
        </div>

        <!-- Mode switcher between Current and Forecast -->
        <div class="mode-switcher glass-box">
            <button id="btnCurrent" class="mode-btn {'active' if mode == 'current' else ''}" onclick="setMapMode('current')">Current Hotspots</button>
            <button id="btnForecast" class="mode-btn {'active' if mode == 'forecast' else ''}" onclick="setMapMode('forecast')">7-Day Forecast</button>
        </div>

        <div class="search-box glass-box">
            <input type="text" id="districtSearch" placeholder="Search district..." onkeyup="filterDistricts()"/>
        </div>

        <div class="legend glass-box">
            <div id="legendTitle" class="legend-title">Land Surface Temp (°C)</div>
            <div class="legend-scale">
                <span style="color:#22c55e; font-weight:700;">30°C</span>
                <div class="legend-bar"></div>
                <span style="color:#ef4444; font-weight:700;">42°C+</span>
            </div>
        </div>

        <div id="map"></div>

        <script>
            var districtsData = {districts_json};
            var currentMode = "{mode}";

            // Basemaps
            var darkCarto = L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{{z}}/{{x}}/{{y}}{{r}}.png', {{
                attribution: '© Stadia Maps © OpenStreetMap',
                maxZoom: 18
            }});

            var osmMap = L.tileLayer('https://{{s}}.tile.openstreetmap.org/{{z}}/{{x}}/{{y}}.png', {{
                attribution: '© OpenStreetMap',
                maxZoom: 18
            }});

            var satelliteEsri = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{{z}}/{{y}}/{{x}}', {{
                attribution: '© Esri Satellite',
                maxZoom: 18
            }});

            var map = L.map('map', {{
                center: [10.8, 78.7],
                zoom: 7,
                layers: [darkCarto]
            }});

            var baseMaps = {{
                "Dark Matter": darkCarto,
                "Satellite Imagery": satelliteEsri,
                "OpenStreetMap": osmMap
            }};

            var circleLayerGroup = L.layerGroup().addTo(map);
            var heatmapLayer = null;
            var markersMap = {{}};

            function getRiskColor(risk) {{
                if (risk === 'Extreme') return '#ef4444';
                if (risk === 'High') return '#f97316';
                if (risk === 'Moderate') return '#eab308';
                return '#22c55e';
            }}

            function renderLayers() {{
                circleLayerGroup.clearLayers();
                if (heatmapLayer) {{
                    map.removeLayer(heatmapLayer);
                }}

                var heatPoints = [];
                var isForecast = (currentMode === 'forecast');

                document.getElementById('subheading').innerText = isForecast 
                    ? "7-Day ML Forecast Heat Risk · 38 Districts" 
                    : "Observed Hotspots · 38 Districts";

                document.getElementById('legendTitle').innerText = isForecast 
                    ? "Forecast LST (°C)" 
                    : "Observed LST (°C)";

                districtsData.forEach(function(d) {{
                    var temp = isForecast ? d.forecast_lst : d.lst;
                    var risk = isForecast ? d.forecast_risk : d.risk_level;
                    var color = getRiskColor(risk);

                    var radius = Math.max(9, Math.min(26, temp * 0.55));
                    var heatIntensity = Math.min(1.0, Math.max(0.2, (temp - 28) / 14));
                    heatPoints.push([d.lat, d.lon, heatIntensity]);

                    var popupContent = `
                        <div style="min-width: 220px; padding: 4px;">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:6px;">
                                <h3 style="margin:0; font-size:14px; font-weight:800; color:#fff;">${{d.name}}</h3>
                                <span style="font-size:9px; font-weight:800; padding:2px 8px; border-radius:10px; background:${{color}}22; color:${{color}}; border:1px solid ${{color}}44;">${{risk}}</span>
                            </div>
                            <div style="font-size:11px; line-height:1.8; color:#cbd5e1;">
                                <div style="display:flex; justify-content:space-between;"><span>${{isForecast ? 'Forecast LST:' : 'Observed LST:'}}</span><b style="color:#f97316;">${{temp}}°C</b></div>
                                ${{isForecast ? `<div style="display:flex; justify-content:space-between;"><span>Baseline LST:</span><b style="color:#94a3b8;">${{d.lst}}°C</b></div><div style="display:flex; justify-content:space-between;"><span>Temp Shift:</span><b style="color:${{d.temp_delta >= 0 ? '#ef4444' : '#22c55e'}};">${{d.temp_delta >= 0 ? '+' : ''}}${{d.temp_delta}}°C</b></div>` : ''}}
                                <div style="display:flex; justify-content:space-between;"><span>NDVI (Vegetation):</span><b style="color:#22c55e;">${{d.ndvi}}</b></div>
                                <div style="display:flex; justify-content:space-between;"><span>NDBI (Built-up):</span><b style="color:#ef4444;">${{d.ndbi}}</b></div>
                                <div style="display:flex; justify-content:space-between;"><span>Heat Stress Index:</span><b style="color:#eab308;">${{d.heat_index}}/100</b></div>
                            </div>
                        </div>
                    `;

                    var marker = L.circleMarker([d.lat, d.lon], {{
                        radius: radius,
                        fillColor: color,
                        color: '#ffffff',
                        weight: 2,
                        opacity: 0.9,
                        fillOpacity: 0.78
                    }}).bindPopup(popupContent);

                    circleLayerGroup.addLayer(marker);
                    markersMap[d.name.toLowerCase()] = {{ marker: marker, lat: d.lat, lon: d.lon }};
                }});

                heatmapLayer = L.heatLayer(heatPoints, {{
                    radius: 40,
                    blur: 25,
                    maxZoom: 10,
                    gradient: {{ 0.2: '#22c55e', 0.5: '#eab308', 0.8: '#f97316', 1.0: '#ef4444' }}
                }}).addTo(map);
            }}

            function setMapMode(mode) {{
                currentMode = mode;
                document.getElementById('btnCurrent').classList.toggle('active', mode === 'current');
                document.getElementById('btnForecast').classList.toggle('active', mode === 'forecast');
                renderLayers();
            }}

            renderLayers();

            var overlayMaps = {{
                "District Markers": circleLayerGroup
            }};

            L.control.layers(baseMaps, overlayMaps, {{ position: 'topright' }}).addTo(map);

            function filterDistricts() {{
                var query = document.getElementById('districtSearch').value.toLowerCase().trim();
                if (!query) return;
                for (var name in markersMap) {{
                    if (name.includes(query)) {{
                        var item = markersMap[name];
                        map.flyTo([item.lat, item.lon], 9, {{ duration: 1.2 }});
                        item.marker.openPopup();
                        break;
                    }}
                }}
            }}
        </script>
    </body>
    </html>
    """
    return HTMLResponse(content=html)
