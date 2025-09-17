import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSimpleAuthStore } from '../store/simpleAuthStore';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { employee, logout } = useSimpleAuthStore();
  const [notifications, setNotifications] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            await logout();
          }
        }
      ]
    );
  };

  const handleClearCache = () => {
    Alert.alert(
      'Limpiar Caché',
      '¿Estás seguro de que quieres limpiar la caché de la aplicación?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpiar',
          onPress: () => {
            Alert.alert('Éxito', 'Caché limpiada correctamente');
          }
        }
      ]
    );
  };

  const handleAbout = () => {
    Alert.alert(
      'Acerca de',
      'Sistema de Comandas v1.0.0\n\nDesarrollado para gestión de restaurantes.\n\n© 2025 Sistema de Comandas',
      [{ text: 'Cerrar', style: 'default' }]
    );
  };

  const SettingItem = ({ 
    icon, 
    title, 
    subtitle, 
    onPress, 
    rightComponent,
    showArrow = true 
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightComponent?: React.ReactNode;
    showArrow?: boolean;
  }) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingLeft}>
        <Text style={styles.settingIcon}>{icon}</Text>
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && (
            <Text style={styles.settingSubtitle}>{subtitle}</Text>
          )}
        </View>
      </View>
      <View style={styles.settingRight}>
        {rightComponent || (showArrow && onPress && (
          <Text style={styles.settingArrow}>›</Text>
        ))}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={styles.header}>
        <Text style={styles.title}>Configuración</Text>
        <Text style={styles.subtitle}>Ajustes y preferencias</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Información del empleado */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información Personal</Text>
          <View style={styles.profileCard}>
            <View style={styles.profileInfo}>
              <View style={styles.profileIcon}>
                <Text style={styles.profileIconText}>👤</Text>
              </View>
              <View style={styles.profileText}>
                <Text style={styles.profileName}>{employee?.name}</Text>
                <Text style={styles.profilePosition}>
                  {employee?.position === 'mesero' ? 'Mesero' : 'Cocinero'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Notificaciones */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notificaciones</Text>
          <SettingItem
            icon="🔔"
            title="Notificaciones Push"
            subtitle="Recibir notificaciones de nuevas comandas"
            rightComponent={
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
                thumbColor={notifications ? '#ffffff' : '#f4f3f4'}
              />
            }
            showArrow={false}
          />
          <SettingItem
            icon="🔊"
            title="Sonido"
            subtitle="Reproducir sonidos de notificación"
            rightComponent={
              <Switch
                value={soundEnabled}
                onValueChange={setSoundEnabled}
                trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
                thumbColor={soundEnabled ? '#ffffff' : '#f4f3f4'}
              />
            }
            showArrow={false}
          />
          <SettingItem
            icon="📳"
            title="Vibración"
            subtitle="Vibrar con notificaciones"
            rightComponent={
              <Switch
                value={vibrationEnabled}
                onValueChange={setVibrationEnabled}
                trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
                thumbColor={vibrationEnabled ? '#ffffff' : '#f4f3f4'}
              />
            }
            showArrow={false}
          />
        </View>

        {/* Aplicación */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Aplicación</Text>
          <SettingItem
            icon="🗑️"
            title="Limpiar Caché"
            subtitle="Liberar espacio de almacenamiento"
            onPress={handleClearCache}
          />
          <SettingItem
            icon="🔄"
            title="Sincronizar Datos"
            subtitle="Actualizar información del servidor"
            onPress={() => Alert.alert('Sincronizar', 'Datos sincronizados correctamente')}
          />
        </View>

        {/* Información */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información</Text>
          <SettingItem
            icon="ℹ️"
            title="Acerca de"
            subtitle="Versión 1.0.0"
            onPress={handleAbout}
          />
          <SettingItem
            icon="📞"
            title="Soporte"
            subtitle="Contactar soporte técnico"
            onPress={() => Alert.alert('Soporte', 'Contacta al administrador del sistema')}
          />
        </View>

        {/* Sesión */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sesión</Text>
          <SettingItem
            icon="🚪"
            title="Cerrar Sesión"
            subtitle="Salir de la aplicación"
            onPress={handleLogout}
            showArrow={false}
          />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Sistema de Comandas v1.0.0
          </Text>
          <Text style={styles.footerSubtext}>
            Desarrollado para gestión de restaurantes
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileIconText: {
    fontSize: 20,
  },
  profileText: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  profilePosition: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 2,
  },
  settingItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  settingRight: {
    marginLeft: 16,
  },
  settingArrow: {
    fontSize: 20,
    color: '#9ca3af',
  },
  footer: {
    alignItems: 'center',
    padding: 32,
    marginTop: 24,
  },
  footerText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
  },
  footerSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
  },
});
