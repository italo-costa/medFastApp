import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Text,
  Alert,
  Dimensions,
  ActivityIndicator,
  Switch,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import MapView, { 
  Marker, 
  Heatmap, 
  PROVIDER_GOOGLE,
  Circle,
  Polygon,
  Callout 
} from 'react-native-maps';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';

const { width, height } = Dimensions.get('window');

const AnalyticsGeograficoMobile = () => {
  const [mapData, setMapData] = useState({});
  const [currentMapType, setCurrentMapType] = useState('estabelecimentos');
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [newMarkerData, setNewMarkerData] = useState({});
  const [region, setRegion] = useState({
    latitude: -14.2350,
    longitude: -51.9253,
    latitudeDelta: 30.0,
    longitudeDelta: 30.0,
  });

  const mapRef = useRef(null);

  useEffect(() => {
    loadMapData();
  }, []);

  const loadMapData = async () => {
    setLoading(true);
    
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
      setMapData(data.data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      Alert.alert('Erro', 'Falha ao carregar dados do mapa');
    } finally {
      setLoading(false);
    }
  };

  const getMarkerIcon = (category) => {
    const icons = {
      hospital: '🏥',
      ubs: '🏪',
      clinica: '🏢',
      laboratorio: '🔬',
      farmacia: '💊'
    };
    return icons[category] || '📍';
  };

  const getMarkerColor = (category) => {
    const colors = {
      hospital: '#e74c3c',
      ubs: '#3498db',
      clinica: '#2ecc71',
      laboratorio: '#f39c12',
      farmacia: '#9b59b6'
    };
    return colors[category] || '#95a5a6';
  };

  const renderMarkers = () => {
    if (!mapData.mapas?.estabelecimentosSUS?.markers) return null;

    return mapData.mapas.estabelecimentosSUS.markers.map((marker, index) => (
      <Marker
        key={`marker-${index}`}
        coordinate={{
          latitude: marker.position[0],
          longitude: marker.position[1]
        }}
        title={marker.title}
        description={marker.description}
        pinColor={getMarkerColor(marker.category)}
        draggable={editMode}
        onDragEnd={(e) => updateMarkerPosition(marker.id, e.nativeEvent.coordinate)}
        onPress={() => setSelectedMarker(marker)}
      >
        <Callout>
          <View style={styles.calloutContainer}>
            <Text style={styles.calloutTitle}>{marker.title}</Text>
            <Text style={styles.calloutDescription}>{marker.description}</Text>
            {marker.dados && (
              <View style={styles.calloutDetails}>
                <Text style={styles.calloutText}>CNES: {marker.dados.cnes}</Text>
                <Text style={styles.calloutText}>Tipo: {marker.dados.tipo}</Text>
                <Text style={styles.calloutText}>Telefone: {marker.dados.telefone}</Text>
              </View>
            )}
            {editMode && (
              <View style={styles.calloutActions}>
                <TouchableOpacity 
                  style={styles.editButton}
                  onPress={() => editMarker(marker)}
                >
                  <Text style={styles.buttonText}>✏️ Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.deleteButton}
                  onPress={() => deleteMarker(marker.id)}
                >
                  <Text style={styles.buttonText}>🗑️ Excluir</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </Callout>
      </Marker>
    ));
  };

  const renderHeatmap = () => {
    if (!showHeatmap || !mapData.mapas?.distribuicaoConsultas?.data) return null;

    const heatmapData = mapData.mapas.distribuicaoConsultas.data.map(point => ({
      latitude: point.lat,
      longitude: point.lng,
      weight: point.weight || 1
    }));

    return (
      <Heatmap
        points={heatmapData}
        opacity={0.7}
        radius={50}
        maxIntensity={100}
        gradientSmoothing={10}
        heatmapMode="POINTS_DENSITY"
      />
    );
  };

  const renderOperadorasCircles = () => {
    if (currentMapType !== 'operadoras' || !mapData.mapas?.operadorasANS?.regions) return null;

    return Object.entries(mapData.mapas.operadorasANS.regions).map(([uf, dados]) => {
      const center = getStateCenter(uf);
      const radius = Math.sqrt(dados.quantidadeOperadoras) * 1000;

      return (
        <Circle
          key={`circle-${uf}`}
          center={{
            latitude: center[0],
            longitude: center[1]
          }}
          radius={radius}
          fillColor={`${getColorForOperadoras(dados.quantidadeOperadoras)}80`}
          strokeColor={getColorForOperadoras(dados.quantidadeOperadoras)}
          strokeWidth={2}
        />
      );
    });
  };

  const onMapPress = (e) => {
    if (editMode && currentMapType === 'estabelecimentos') {
      const { latitude, longitude } = e.nativeEvent.coordinate;
      setNewMarkerData({
        position: [latitude, longitude],
        title: '',
        description: '',
        category: 'clinica'
      });
      setModalVisible(true);
    }
  };

  const addNewMarker = async () => {
    try {
      const response = await fetch('/api/external/analytics/maps/marker/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMarkerData)
      });

      const result = await response.json();
      if (result.success) {
        Alert.alert('Sucesso', 'Novo estabelecimento adicionado');
        setModalVisible(false);
        loadMapData();
      }
    } catch (error) {
      console.error('Erro ao criar marker:', error);
      Alert.alert('Erro', 'Falha ao adicionar estabelecimento');
    }
  };

  const updateMarkerPosition = async (markerId, newPosition) => {
    try {
      const response = await fetch('/api/external/analytics/maps/marker/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          markerId,
          position: [newPosition.latitude, newPosition.longitude]
        })
      });

      const result = await response.json();
      if (result.success) {
        Alert.alert('Sucesso', 'Posição atualizada');
      }
    } catch (error) {
      console.error('Erro ao atualizar marker:', error);
    }
  };

  const editMarker = (marker) => {
    setNewMarkerData({
      id: marker.id,
      title: marker.title,
      description: marker.description,
      category: marker.category,
      position: marker.position
    });
    setModalVisible(true);
  };

  const deleteMarker = (markerId) => {
    Alert.alert(
      'Confirmar Exclusão',
      'Tem certeza que deseja excluir este estabelecimento?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Excluir', 
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`/api/external/analytics/maps/marker/${markerId}`, {
                method: 'DELETE'
              });

              const result = await response.json();
              if (result.success) {
                Alert.alert('Sucesso', 'Estabelecimento removido');
                loadMapData();
              }
            } catch (error) {
              console.error('Erro ao remover marker:', error);
              Alert.alert('Erro', 'Falha ao remover estabelecimento');
            }
          }
        }
      ]
    );
  };

  const getStateCenter = (uf) => {
    const centros = {
      'SP': [-23.5505, -46.6333],
      'RJ': [-22.9068, -43.1729],
      'MG': [-19.9191, -43.9386],
      'RS': [-30.0346, -51.2177],
      'PR': [-25.4284, -49.2733],
      'SC': [-27.5954, -48.5480],
      'BA': [-12.9714, -38.5014],
      'CE': [-3.7319, -38.5267],
      'PE': [-8.0476, -34.8770],
      'GO': [-16.6869, -49.2648]
    };
    return centros[uf] || [-14.2350, -51.9253];
  };

  const getColorForOperadoras = (quantidade) => {
    if (quantidade > 200) return '#e74c3c';
    if (quantidade > 100) return '#f39c12';
    if (quantidade > 50) return '#f1c40f';
    return '#2ecc71';
  };

  const renderStats = () => {
    if (!mapData.mapas) return null;

    const stats = [
      {
        label: 'Estabelecimentos',
        value: mapData.mapas.estabelecimentosSUS?.markers?.length || 0,
        icon: 'local-hospital',
        color: '#e74c3c'
      },
      {
        label: 'Operadoras',
        value: Object.keys(mapData.mapas.operadorasANS?.regions || {}).length,
        icon: 'business',
        color: '#3498db'
      },
      {
        label: 'Regiões',
        value: 27,
        icon: 'place',
        color: '#2ecc71'
      },
      {
        label: 'Pontos de Calor',
        value: mapData.mapas.distribuicaoConsultas?.data?.length || 0,
        icon: 'whatshot',
        color: '#f39c12'
      }
    ];

    return (
      <View style={styles.statsContainer}>
        {stats.map((stat, index) => (
          <View key={index} style={[styles.statCard, { borderColor: stat.color }]}>
            <Icon name={stat.icon} size={24} color={stat.color} />
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderMapTypeSelector = () => {
    const mapTypes = [
      { key: 'estabelecimentos', label: '🏥 Estabelecimentos', icon: 'local-hospital' },
      { key: 'operadoras', label: '🩺 Operadoras', icon: 'business' },
      { key: 'densidade', label: '📊 Densidade', icon: 'assessment' },
      { key: 'consultas', label: '🔥 Calor', icon: 'whatshot' }
    ];

    return (
      <ScrollView 
        horizontal 
        style={styles.mapTypeSelector}
        showsHorizontalScrollIndicator={false}
      >
        {mapTypes.map((type) => (
          <TouchableOpacity
            key={type.key}
            style={[
              styles.mapTypeButton,
              currentMapType === type.key && styles.mapTypeButtonActive
            ]}
            onPress={() => setCurrentMapType(type.key)}
          >
            <Icon 
              name={type.icon} 
              size={20} 
              color={currentMapType === type.key ? '#fff' : '#666'} 
            />
            <Text style={[
              styles.mapTypeText,
              currentMapType === type.key && styles.mapTypeTextActive
            ]}>
              {type.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  const renderControls = () => (
    <View style={styles.controls}>
      <View style={styles.controlRow}>
        <Text style={styles.controlLabel}>Modo Edição</Text>
        <Switch
          value={editMode}
          onValueChange={setEditMode}
          trackColor={{ false: '#767577', true: '#4f46e5' }}
          thumbColor={editMode ? '#f4f3f4' : '#f4f3f4'}
        />
      </View>

      <View style={styles.controlRow}>
        <Text style={styles.controlLabel}>Mapa de Calor</Text>
        <Switch
          value={showHeatmap}
          onValueChange={setShowHeatmap}
          trackColor={{ false: '#767577', true: '#e74c3c' }}
          thumbColor={showHeatmap ? '#f4f3f4' : '#f4f3f4'}
        />
      </View>

      <TouchableOpacity style={styles.refreshButton} onPress={loadMapData}>
        <Icon name="refresh" size={20} color="#fff" />
        <Text style={styles.refreshText}>Atualizar</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={styles.loadingText}>Carregando dados geográficos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header com estatísticas */}
      <View style={styles.header}>
        <Text style={styles.title}>🗺️ Analytics Geográfico</Text>
        {renderStats()}
      </View>

      {/* Seletor de tipo de mapa */}
      {renderMapTypeSelector()}

      {/* Controles */}
      {renderControls()}

      {/* Mapa */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          region={region}
          onRegionChangeComplete={setRegion}
          onPress={onMapPress}
          showsUserLocation={true}
          showsMyLocationButton={true}
          toolbarEnabled={false}
        >
          {currentMapType === 'estabelecimentos' && renderMarkers()}
          {currentMapType === 'operadoras' && renderOperadorasCircles()}
          {renderHeatmap()}
        </MapView>

        {editMode && (
          <View style={styles.editModeIndicator}>
            <Icon name="edit" size={16} color="#fff" />
            <Text style={styles.editModeText}>Modo Edição Ativo</Text>
          </View>
        )}
      </View>

      {/* Modal para adicionar/editar marker */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {newMarkerData.id ? 'Editar Estabelecimento' : 'Novo Estabelecimento'}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Nome do estabelecimento"
              value={newMarkerData.title}
              onChangeText={(text) => setNewMarkerData({...newMarkerData, title: text})}
            />

            <TextInput
              style={styles.input}
              placeholder="Descrição"
              value={newMarkerData.description}
              onChangeText={(text) => setNewMarkerData({...newMarkerData, description: text})}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.buttonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={addNewMarker}
              >
                <Text style={styles.buttonText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 16,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    margin: 4,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2d3748',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#718096',
    marginTop: 2,
    textAlign: 'center',
  },
  mapTypeSelector: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  mapTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    backgroundColor: '#f1f5f9',
    borderRadius: 20,
  },
  mapTypeButtonActive: {
    backgroundColor: '#4f46e5',
  },
  mapTypeText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  mapTypeTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  controls: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  controlLabel: {
    fontSize: 16,
    color: '#4a5568',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4f46e5',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  refreshText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: '600',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  editModeIndicator: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#e74c3c',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  editModeText: {
    color: '#fff',
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '600',
  },
  calloutContainer: {
    width: 250,
    padding: 12,
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 4,
  },
  calloutDescription: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 8,
  },
  calloutDetails: {
    marginBottom: 8,
  },
  calloutText: {
    fontSize: 12,
    color: '#4a5568',
    marginBottom: 2,
  },
  calloutActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  editButton: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 24,
    margin: 20,
    borderRadius: 16,
    width: width - 40,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  cancelButton: {
    backgroundColor: '#6b7280',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 0.45,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 0.45,
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#718096',
  },
});

export default AnalyticsGeograficoMobile;