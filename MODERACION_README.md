# Sistema de Moderación - Bot Casino

## Descripción
Sistema completo de moderación estilo MEE6 para el bot de casino, con paneles interactivos, logs detallados y gestión de sanciones.

## Características Principales

### 🎛️ Panel de Moderación Interactivo
- **Comando:** `/moderar @usuario`
- Panel estilo MEE6 con información completa del usuario
- Botones para todas las acciones de moderación
- Estadísticas en tiempo real del usuario
- Historial de acciones recientes

### 🔧 Configuración del Sistema
- **Comando:** `/configurar-moderacion`
- Configuración de canales de logs por tipo de acción
- Configuración de roles de moderación
- Sistema de AutoMod configurable
- Configuración de duraciones por defecto

### 📊 Estadísticas y Reportes
- **Comando:** `/estadisticas-moderacion`
- Estadísticas del servidor completo
- Estadísticas por usuario específico
- Estadísticas por moderador
- Análisis de tendencias de moderación

### 🚫 Gestión de Sanciones
- **Comando:** `/remover-sancion`
- Remover mutes, bans y timeouts
- Logs de remoción de sanciones
- Notificaciones automáticas al usuario

## Acciones de Moderación Disponibles

### ⚡ Strike
- Sanción formal con duración opcional
- Registro en base de datos
- Notificación al usuario

### 👢 Kick
- Expulsión temporal del servidor
- Registro de la acción
- Notificación previa al usuario

### 🔇 Mute
- Silenciamiento con rol específico
- Duración configurable
- Auto-remoción programada

### 🔨 Ban
- Baneo permanente o temporal
- Eliminación de mensajes (7 días)
- Registro completo de la acción

### ⚠️ Advertencia
- Advertencia formal sin sanción
- Acumulación para AutoMod
- Historial de advertencias

### ⏰ Timeout
- Timeout nativo de Discord
- Duración máxima 28 días
- Remoción automática

## Sistema de Logs

### Canales de Logs Configurables
- **Strikes:** Canal específico para strikes
- **Kicks:** Canal específico para kicks
- **Mutes:** Canal específico para mutes
- **Bans:** Canal específico para bans
- **Advertencias:** Canal específico para advertencias
- **Timeouts:** Canal específico para timeouts
- **General:** Canal para todas las acciones

### Información en Logs
- Usuario moderado (con avatar)
- Moderador que realizó la acción
- Razón detallada
- ID único del caso
- Duración (si aplica)
- Timestamp completo

## Base de Datos

### Modelos Creados

#### ModerationLog
```javascript
{
    guildId: String,
    userId: String,
    username: String,
    moderatorId: String,
    moderatorUsername: String,
    action: String, // strike, kick, mute, ban, warn, timeout
    reason: String,
    duration: Number, // minutos
    caseId: String, // ID único
    timestamp: Date,
    active: Boolean
}
```

#### ModerationConfig
```javascript
{
    guildId: String,
    logChannels: {
        strikes: String,
        kicks: String,
        mutes: String,
        bans: String,
        warnings: String,
        timeouts: String,
        general: String
    },
    roles: {
        moderator: String,
        admin: String,
        muted: String
    },
    autoMod: {
        enabled: Boolean,
        maxWarnings: Number,
        autoMuteAfterWarnings: Number,
        autoKickAfterWarnings: Number,
        autoBanAfterWarnings: Number
    }
}
```

#### UserModerationStats
```javascript
{
    guildId: String,
    userId: String,
    username: String,
    strikes: Number,
    warnings: Number,
    kicks: Number,
    mutes: Number,
    timeouts: Number,
    bans: Number,
    isMuted: Boolean,
    isBanned: Boolean,
    lastAction: String,
    lastActionDate: Date
}
```

## Configuración Inicial

### 1. Configurar Canales de Logs
```
/configurar-moderacion canales tipo:general canal:#logs-moderacion
/configurar-moderacion canales tipo:strikes canal:#logs-strikes
/configurar-moderacion canales tipo:bans canal:#logs-bans
```

### 2. Configurar Roles
```
/configurar-moderacion roles tipo:moderator rol:@Moderador
/configurar-moderacion roles tipo:muted rol:@Muteado
```

### 3. Configurar AutoMod (Opcional)
```
/configurar-moderacion automod habilitado:true max-advertencias:3
```

## Uso del Sistema

### Panel de Moderación
1. Usar `/moderar @usuario`
2. Revisar información del usuario
3. Seleccionar acción con botones
4. Completar formulario modal
5. Confirmar acción

### Ver Configuración
```
/configurar-moderacion ver
```

### Ver Estadísticas
```
/estadisticas-moderacion servidor
/estadisticas-moderacion usuario @usuario
/estadisticas-moderacion moderador @moderador
```

### Remover Sanciones
```
/remover-sancion usuario:@usuario tipo:mute razon:Apelación aceptada
```

## Permisos Requeridos

### Para Usar el Sistema
- Rol de moderador configurado
- Permisos de `ModerateMembers` en Discord

### Para Configurar
- Rol de administrador
- Permisos de `Administrator` en Discord

## Características Técnicas

### Seguridad
- Validación de jerarquía de roles
- Verificación de permisos
- Prevención de auto-moderación
- Logs de todas las acciones

### Rendimiento
- Índices optimizados en base de datos
- Consultas eficientes
- Manejo de errores robusto
- Timeouts para interacciones

### Escalabilidad
- Sistema modular
- Configuración por servidor
- Soporte para múltiples idiomas
- Fácil extensión de funcionalidades

## Mantenimiento

### Limpieza de Datos
- Los logs se mantienen indefinidamente
- Las estadísticas se actualizan automáticamente
- Los casos inactivos se marcan como tal

### Monitoreo
- Logs de errores en consola
- Validación de configuración
- Verificación de permisos

## Soporte

Para problemas o dudas sobre el sistema de moderación:
1. Revisar los logs del bot
2. Verificar la configuración con `/configurar-moderacion ver`
3. Comprobar permisos de roles
4. Contactar al desarrollador

---

**Desarrollado para el Bot Casino bet365**  
*Sistema de moderación profesional y completo*
