/**
 * 🗺️ COMPONENTE DE MAPAS INTERATIVOS PARA ANALYTICS
 * 
 * Visualiza dados das integrações externas em mapas geográficos
 * com suporte a edição e consulta interativa.
 * 
 * @author MediApp GeoAnalytics Team
 * @version 1.0.0
 */

import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat/dist/leaflet-heat.js';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster/dist/leaflet.markercluster.js';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    Button,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    Badge,
    Switch,
    Slider,
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '../ui/components';

const InteractiveGeoMap = ({ 
    mapConfig, 
    onMarkerEdit, 
    onMarkerAdd, 
    onDataUpdate,
    isLoading = false 
}) => {
    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const markersRef = useRef([]);
    const heatmapRef = useRef(null);
    const [selectedLayer, setSelectedLayer] = useState('markers');
    const [editMode, setEditMode] = useState(false);
    const [selectedMarker, setSelectedMarker] = useState(null);
    const [showClusters, setShowClusters] = useState(true);
    const [heatmapIntensity, setHeatmapIntensity] = useState(0.5);

    useEffect(() => {
        if (mapRef.current && mapConfig) {
            initializeMap();
        }

        return () => {
            if (mapInstance.current) {
                mapInstance.current.remove();
            }
        };
    }, [mapConfig]);

    const initializeMap = () => {
        // Configurar ícones do Leaflet
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
            iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });

        // Criar mapa
        mapInstance.current = L.map(mapRef.current).setView(
            mapConfig.center, 
            mapConfig.zoom
        );

        // Adicionar tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(mapInstance.current);

        // Carregar dados baseado no tipo
        switch (mapConfig.type) {
            case 'markers':
                loadMarkers();
                break;
            case 'heatmap':
                loadHeatmap();
                break;
            case 'choropleth':
                loadChoropleth();
                break;
            case 'regions':
                loadRegions();
                break;
            default:
                loadMarkers();
        }

        // Configurar eventos de edição
        if (mapConfig.config?.editMode) {
            setupEditMode();
        }
    };

    const loadMarkers = () => {
        const markersGroup = showClusters ? 
            L.markerClusterGroup() : 
            L.layerGroup();

        mapConfig.markers?.forEach((markerData, index) => {
            const icon = createCustomIcon(markerData);
            const marker = L.marker(markerData.position, { icon })
                .bindPopup(createPopupContent(markerData))
                .on('click', () => handleMarkerClick(markerData));

            if (editMode) {
                marker.dragging.enable();
                marker.on('dragend', (e) => handleMarkerDrag(e, markerData));
            }

            markersGroup.addLayer(marker);
            markersRef.current.push({ marker, data: markerData });
        });

        markersGroup.addTo(mapInstance.current);
    };

    const loadHeatmap = () => {
        if (mapConfig.data) {
            const heatData = mapConfig.data.map(point => [
                point.lat, 
                point.lng, 
                point.weight * heatmapIntensity
            ]);

            heatmapRef.current = L.heatLayer(heatData, {
                radius: 25,
                blur: 15,
                maxZoom: 17,
                gradient: mapConfig.config?.gradient || {
                    0.2: 'blue',
                    0.4: 'cyan', 
                    0.6: 'lime',
                    0.8: 'yellow',
                    1.0: 'red'
                }
            }).addTo(mapInstance.current);
        }
    };

    const loadChoropleth = () => {
        // Simulação de GeoJSON para estados brasileiros
        const geojsonFeature = {
            type: 'FeatureCollection',
            features: Object.entries(mapConfig.data || {}).map(([uf, dados]) => ({
                type: 'Feature',
                properties: {
                    uf,
                    ...dados
                },
                geometry: generateStateGeometry(uf) // Função simulada
            }))
        };

        L.geoJSON(geojsonFeature, {
            style: (feature) => ({
                fillColor: getColorForValue(feature.properties[mapConfig.config.valueProperty]),
                weight: 2,
                opacity: 1,
                color: 'white',
                dashArray: '3',
                fillOpacity: 0.7
            }),
            onEachFeature: (feature, layer) => {
                layer.bindPopup(`
                    <h3>${feature.properties.nome}</h3>
                    <p><strong>UF:</strong> ${feature.properties.uf}</p>
                    <p><strong>Densidade:</strong> ${feature.properties.densidade}</p>
                    <p><strong>Estabelecimentos:</strong> ${feature.properties.estabelecimentos}</p>
                    <p><strong>População:</strong> ${feature.properties.populacao?.toLocaleString()}</p>
                `);
            }
        }).addTo(mapInstance.current);
    };

    const loadRegions = () => {
        // Similar ao choropleth mas com foco em operadoras
        Object.entries(mapConfig.regions || {}).forEach(([uf, dados]) => {
            // Implementação simplificada para demonstração
            const center = getStateCenter(uf);
            const circle = L.circle(center, {
                color: getColorForOperadoras(dados.quantidadeOperadoras),
                fillColor: getColorForOperadoras(dados.quantidadeOperadoras),
                fillOpacity: 0.6,
                radius: dados.quantidadeOperadoras * 1000
            }).addTo(mapInstance.current);

            circle.bindPopup(`
                <h3>${uf}</h3>
                <p><strong>Operadoras:</strong> ${dados.quantidadeOperadoras}</p>
                <p><strong>Ativas:</strong> ${dados.operadorasAtivas}</p>
                <p><strong>Beneficiários:</strong> ${dados.beneficiarios?.toLocaleString()}</p>
                <p><strong>Modalidade Principal:</strong> ${dados.modalidadePrincipal}</p>
            `);
        });
    };

    const createCustomIcon = (markerData) => {
        const iconHtml = `
            <div class="custom-marker" style="
                background-color: ${markerData.color};
                width: 30px;
                height: 30px;
                border-radius: 50%;
                border: 3px solid white;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
                box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            ">
                ${markerData.icon}
            </div>
        `;

        return L.divIcon({
            html: iconHtml,
            className: 'custom-div-icon',
            iconSize: [30, 30],
            iconAnchor: [15, 15]
        });
    };

    const createPopupContent = (markerData) => {
        return `
            <div class="map-popup">
                <h3>${markerData.title}</h3>
                <p>${markerData.description}</p>
                ${markerData.dados ? `
                    <div class="popup-details">
                        <p><strong>CNES:</strong> ${markerData.dados.cnes}</p>
                        <p><strong>Tipo:</strong> ${markerData.dados.tipo}</p>
                        <p><strong>Telefone:</strong> ${markerData.dados.telefone}</p>
                        <p><strong>Horários:</strong> ${markerData.dados.horarios}</p>
                        <div class="especialidades">
                            <strong>Especialidades:</strong>
                            ${markerData.dados.especialidades?.map(esp => 
                                `<span class="especialidade-tag">${esp}</span>`
                            ).join('')}
                        </div>
                    </div>
                ` : ''}
                ${editMode ? `
                    <div class="popup-actions">
                        <button onclick="editMarker('${markerData.id}')">✏️ Editar</button>
                        <button onclick="deleteMarker('${markerData.id}')">🗑️ Excluir</button>
                    </div>
                ` : ''}
            </div>
        `;
    };

    const setupEditMode = () => {
        // Evento para adicionar novos markers
        mapInstance.current.on('click', (e) => {
            if (editMode && mapConfig.config?.allowNewMarkers) {
                const newMarker = {
                    id: `new_marker_${Date.now()}`,
                    position: [e.latlng.lat, e.latlng.lng],
                    title: 'Novo Estabelecimento',
                    description: 'Clique para editar',
                    category: 'clinica',
                    color: '#2ecc71',
                    icon: '🏢',
                    editavel: true
                };

                if (onMarkerAdd) {
                    onMarkerAdd(newMarker);
                }
            }
        });
    };

    const handleMarkerClick = (markerData) => {
        setSelectedMarker(markerData);
        if (editMode && markerData.editavel) {
            // Abrir modal de edição
            openEditModal(markerData);
        }
    };

    const handleMarkerDrag = (e, markerData) => {
        const newPosition = [e.target.getLatLng().lat, e.target.getLatLng().lng];
        const updatedMarker = {
            ...markerData,
            position: newPosition
        };

        if (onMarkerEdit) {
            onMarkerEdit(updatedMarker);
        }
    };

    const openEditModal = (markerData) => {
        // Implementar modal de edição
        console.log('Editando marker:', markerData);
    };

    const updateHeatmapIntensity = (value) => {
        setHeatmapIntensity(value);
        if (heatmapRef.current) {
            heatmapRef.current.remove();
            loadHeatmap();
        }
    };

    const toggleLayer = (layerType) => {
        setSelectedLayer(layerType);
        // Recarregar mapa com novo tipo de layer
        if (mapInstance.current) {
            mapInstance.current.eachLayer((layer) => {
                if (layer !== mapInstance.current._tiles) {
                    mapInstance.current.removeLayer(layer);
                }
            });
        }
        
        switch (layerType) {
            case 'markers':
                loadMarkers();
                break;
            case 'heatmap':
                loadHeatmap();
                break;
            case 'both':
                loadMarkers();
                loadHeatmap();
                break;
        }
    };

    // Funções auxiliares
    const getColorForValue = (value) => {
        const colors = ['#feedde', '#fdd0a2', '#fdae6b', '#fd8d3c', '#e6550d', '#a63603'];
        const index = Math.floor(value * colors.length);
        return colors[Math.min(index, colors.length - 1)];
    };

    const getColorForOperadoras = (quantidade) => {
        if (quantidade > 200) return '#e74c3c';
        if (quantidade > 100) return '#f39c12';
        if (quantidade > 50) return '#f1c40f';
        return '#2ecc71';
    };

    const getStateCenter = (uf) => {
        const centros = {
            'SP': [-23.5505, -46.6333],
            'RJ': [-22.9068, -43.1729],
            'MG': [-19.9191, -43.9386],
            'RS': [-30.0346, -51.2177],
            'PR': [-25.4284, -49.2733]
        };
        return centros[uf] || [-14.2350, -51.9253];
    };

    const generateStateGeometry = (uf) => {
        // Geometria simplificada para demonstração
        const center = getStateCenter(uf);
        return {
            type: 'Polygon',
            coordinates: [[
                [center[1] - 1, center[0] - 1],
                [center[1] + 1, center[0] - 1],
                [center[1] + 1, center[0] + 1],
                [center[1] - 1, center[0] + 1],
                [center[1] - 1, center[0] - 1]
            ]]
        };
    };

    return (
        <Card className="w-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div>
                    <CardTitle className="text-lg font-semibold">
                        {mapConfig.config?.title || 'Mapa Interativo'}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                        {mapConfig.config?.description || 'Visualização geográfica dos dados'}
                    </p>
                </div>
                
                <div className="flex items-center space-x-2">
                    {mapConfig.type === 'markers' && (
                        <>
                            <div className="flex items-center space-x-2">
                                <span className="text-sm">Clusters:</span>
                                <Switch 
                                    checked={showClusters}
                                    onCheckedChange={setShowClusters}
                                />
                            </div>
                            
                            <div className="flex items-center space-x-2">
                                <span className="text-sm">Editar:</span>
                                <Switch 
                                    checked={editMode}
                                    onCheckedChange={setEditMode}
                                />
                            </div>
                        </>
                    )}
                    
                    {mapConfig.layers && (
                        <Select value={selectedLayer} onValueChange={toggleLayer}>
                            <SelectTrigger className="w-[120px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="markers">Marcadores</SelectItem>
                                <SelectItem value="heatmap">Mapa de Calor</SelectItem>
                                <SelectItem value="both">Ambos</SelectItem>
                            </SelectContent>
                        </Select>
                    )}
                </div>
            </CardHeader>
            
            <CardContent>
                {/* Controles do Heatmap */}
                {(selectedLayer === 'heatmap' || selectedLayer === 'both') && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-4">
                            <span className="text-sm font-medium">Intensidade:</span>
                            <Slider
                                value={[heatmapIntensity]}
                                onValueChange={(value) => updateHeatmapIntensity(value[0])}
                                max={1}
                                min={0.1}
                                step={0.1}
                                className="flex-1"
                            />
                            <span className="text-sm text-gray-600">
                                {Math.round(heatmapIntensity * 100)}%
                            </span>
                        </div>
                    </div>
                )}

                {/* Legenda das Categorias */}
                {mapConfig.config?.markerCategories && (
                    <div className="mb-4">
                        <h4 className="text-sm font-medium mb-2">Legenda:</h4>
                        <div className="flex flex-wrap gap-2">
                            {mapConfig.config.markerCategories.map((categoria) => (
                                <Badge 
                                    key={categoria.id}
                                    style={{ backgroundColor: categoria.color }}
                                    className="text-white"
                                >
                                    {categoria.icon} {categoria.name}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}
                
                {/* Área do Mapa */}
                <div className="relative">
                    <div 
                        ref={mapRef} 
                        className="w-full h-96 rounded-lg border"
                        style={{ minHeight: '400px' }}
                    />
                    
                    {isLoading && (
                        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    )}
                </div>

                {/* Informações do Marker Selecionado */}
                {selectedMarker && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <h4 className="font-medium text-blue-900">{selectedMarker.title}</h4>
                        <p className="text-sm text-blue-700">{selectedMarker.description}</p>
                        {selectedMarker.dados && (
                            <div className="mt-2 text-xs text-blue-600">
                                <span>CNES: {selectedMarker.dados.cnes}</span> | 
                                <span>Tipo: {selectedMarker.dados.tipo}</span>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

/**
 * 🗺️ DASHBOARD DE MAPAS GEOGRÁFICOS
 */
const GeographicAnalyticsDashboard = () => {
    const [mapsData, setMapsData] = useState(null);
    const [selectedMap, setSelectedMap] = useState('estabelecimentosSUS');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadMapsData();
    }, []);

    const loadMapsData = async () => {
        setIsLoading(true);
        
        try {
            const response = await fetch('/api/external/analytics/consolidated', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    incluirSUS: true,
                    incluirANS: true,
                    municipios: ['355030', '431490', '230440'],
                    ufs: ['SP', 'RJ', 'MG', 'RS', 'CE']
                })
            });

            const data = await response.json();
            setMapsData(data.data.mapas);
        } catch (error) {
            console.error('Erro ao carregar dados dos mapas:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleMarkerEdit = (updatedMarker) => {
        console.log('Marker editado:', updatedMarker);
        // Implementar salvamento
    };

    const handleMarkerAdd = (newMarker) => {
        console.log('Novo marker adicionado:', newMarker);
        // Implementar adição
    };

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Analytics Geográfico</h1>
                    <p className="text-muted-foreground">
                        Visualização e edição de dados em mapas interativos
                    </p>
                </div>
            </div>

            <Tabs value={selectedMap} onValueChange={setSelectedMap}>
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="estabelecimentosSUS">🏥 Estabelecimentos SUS</TabsTrigger>
                    <TabsTrigger value="operadorasANS">🩺 Operadoras ANS</TabsTrigger>
                    <TabsTrigger value="densidadeAtendimento">📊 Densidade</TabsTrigger>
                    <TabsTrigger value="distribuicaoConsultas">🔥 Consultas</TabsTrigger>
                </TabsList>

                <TabsContent value="estabelecimentosSUS">
                    {mapsData?.estabelecimentosSUS && (
                        <InteractiveGeoMap
                            mapConfig={mapsData.estabelecimentosSUS}
                            onMarkerEdit={handleMarkerEdit}
                            onMarkerAdd={handleMarkerAdd}
                            isLoading={isLoading}
                        />
                    )}
                </TabsContent>

                <TabsContent value="operadorasANS">
                    {mapsData?.operadorasANS && (
                        <InteractiveGeoMap
                            mapConfig={mapsData.operadorasANS}
                            onMarkerEdit={handleMarkerEdit}
                            onMarkerAdd={handleMarkerAdd}
                            isLoading={isLoading}
                        />
                    )}
                </TabsContent>

                <TabsContent value="densidadeAtendimento">
                    {mapsData?.densidadeAtendimento && (
                        <InteractiveGeoMap
                            mapConfig={mapsData.densidadeAtendimento}
                            isLoading={isLoading}
                        />
                    )}
                </TabsContent>

                <TabsContent value="distribuicaoConsultas">
                    {mapsData?.distribuicaoConsultas && (
                        <InteractiveGeoMap
                            mapConfig={mapsData.distribuicaoConsultas}
                            isLoading={isLoading}
                        />
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default GeographicAnalyticsDashboard;