# 🎰 Bot de Casino bet365 para Discord

Un bot de Discord completo desarrollado en JavaScript que simula un casino para servidores de GTAHub, con sistema de economía propio, apuestas deportivas y blackjack.

## ✨ Características Principales

### 🎮 Sistema de Juegos
- **Blackjack Completo**: Juego de blackjack con interfaz interactiva usando botones
- **Apuestas Deportivas**: Sistema de apuestas con cálculo de combinadas
- **Calculadora de Combinadas**: Herramienta para calcular ganancias potenciales

### 💰 Sistema de Economía
- **Carteras Digitales**: Sistema completo de wallets para usuarios
- **Códigos de Referidos**: Sistema de referidos con bonificaciones
- **Transacciones**: Registro completo de todas las operaciones financieras
- **Logs de Transacciones**: Sistema de logging mejorado para auditoría

### 🎫 Sistema de Tickets
- **Creación Automática**: Sistema de tickets para soporte técnico
- **Gestión de Tickets**: Comandos para claim, close y transcript
- **Logs de Tickets**: Registro completo de todos los tickets

### 🛠️ Sistema Administrativo
- **Gestión de Carteras**: Comandos para crear, modificar y eliminar carteras
- **Control de Saldos**: Sistema de depósitos y retiros
- **Sistema de Tickets**: Sistema de soporte con tickets
- **Logs Detallados**: Registro completo de todas las acciones administrativas

## 🚀 Instalación

### Prerrequisitos
- Node.js (versión 16 o superior)
- MongoDB
- Bot de Discord configurado

### Pasos de Instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/flacoV/bet365.git
cd bet365
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
Crear un archivo `.env` con las siguientes variables:
```env
# Discord Bot
token=TU_TOKEN_DE_DISCORD
clientid=TU_CLIENT_ID

# Base de datos
MONGODB=mongodb://localhost:27017/bet365

# Roles administrativos
rolceo=ID_DEL_ROL_CEO
ceonotify=ID_DEL_ROL_NOTIFY

# Canales
LOG_CHANNEL_ID=ID_DEL_CANAL_DE_LOGS
TICKET_CATEGORY_ID=ID_DE_LA_CATEGORIA_TICKETS
STAFF_ROLE_ID=ID_DEL_ROL_STAFF
```

4. **Iniciar el bot**
```bash
npm start
```

## 📁 Estructura del Proyecto

```
src/
├── commands/           # Comandos del bot
│   ├── developercms/   # Comandos administrativos
│   └── general/        # Comandos generales
├── events/            # Eventos de Discord
├── functions/         # Funciones auxiliares
├── schema/            # Modelos de base de datos
├── utils/             # Utilidades del sistema
└── buttons.js/        # Sistema de botones
```

## 🎯 Comandos Principales

### Comandos de Usuario
- `/cartera` - Ver información de tu cartera
- `/blackjack <apuesta>` - Jugar blackjack
- `/apostar <monto> <partidos>` - Realizar apuesta deportiva
- `/combinada <monto> <multiplicadores>` - Calcular ganancias de combinada
- `/codigo365 <codigo>` - Crear código de referido

### Comandos Administrativos
- `/crear <usuario> [codigo]` - Crear cartera para usuario
- `/agregar <usuario> <monto>` - Agregar saldo a cartera
- `/quitar <usuario> <monto>` - Quitar saldo de cartera
- `/eliminarWallet <usuario>` - Eliminar cartera de usuario
- `/configurartickets` - Configurar sistema de tickets
- `/verconfigtickets` - Ver configuración actual de tickets

## 🎲 Sistema de Blackjack

El sistema de blackjack incluye:
- **Interfaz Interactiva**: Botones para pedir carta, plantarse o nueva partida
- **Lógica Completa**: Implementación completa de las reglas del blackjack
- **Gestión de Apuestas**: Sistema de apuestas integrado con la economía
- **Logs Automáticos**: Registro de todas las partidas y ganancias

### Reglas del Blackjack
- As cuenta como 11 o 1 según convenga
- Blackjack natural (21 con 2 cartas) paga 3:2
- Dealer se planta en 17
- Usuario puede pedir carta o plantarse

## ⚽ Sistema de Apuestas Deportivas

### Características
- **Límites de Apuesta**: Mínimo $20,000, máximo $1,000,000
- **Combinadas**: Hasta 4 partidos por combinada
- **Cálculo Automático**: Sistema automático de cálculo de ganancias
- **Logs Detallados**: Registro de todas las apuestas

### Tipos de Apuesta
- **1X2**: Victoria local, empate, victoria visitante
- **Combinadas**: Múltiples partidos con multiplicadores

## 💳 Sistema de Carteras

### Características de las Carteras
- **Balance en Tiempo Real**: Actualización instantánea del saldo
- **Historial de Transacciones**: Registro completo de movimientos
- **Códigos de Referido**: Sistema de referidos con bonificaciones
- **Estadísticas**: Información detallada de actividad

### Tipos de Transacciones
- `deposit` - Depósitos
- `withdraw` - Retiros
- `bet` - Apuestas
- `win` - Ganancias

## 🔧 Sistema de Logs

El sistema de logs incluye:
- **Logs de Apuestas**: Registro de todas las apuestas realizadas
- **Logs de Transacciones**: Registro de depósitos y retiros
- **Logs de Carteras**: Registro de creación y modificación de carteras
- **Logs de Blackjack**: Registro de partidas y ganancias

## 🎫 Sistema de Tickets

### Características del Sistema de Tickets
- **Configuración por Comando**: Sistema configurable mediante comandos (no variables de entorno)
- **Creación Automática**: Los usuarios pueden crear tickets de soporte
- **Gestión por Staff**: El staff puede claim, cerrar y generar transcripts
- **Categorización**: Tickets organizados por categorías configurables
- **Logs Completos**: Registro de todos los tickets y su gestión

### Configuración del Sistema
- **`/configurartickets`**: Configura categoría, rol de staff, canales de logs y transcripts
- **`/verconfigtickets`**: Muestra la configuración actual del sistema
- **Validaciones**: Verifica permisos del bot y existencia de canales/roles

### Tipos de Tickets
- **Soporte Técnico**: Para problemas técnicos
- **Notificaciones**: Para notificaciones importantes
- **Contratar Servicios**: Para solicitar servicios

## 🛡️ Seguridad y Validaciones

### Validaciones Implementadas
- **Validación de Montos**: Verificación de límites de apuestas
- **Validación de Saldos**: Verificación de saldo suficiente
- **Validación de Permisos**: Verificación de roles administrativos
- **Validación de Códigos**: Verificación de códigos promocionales

### Manejo de Errores
- **Try-Catch Global**: Manejo de errores en todos los comandos
- **Logs de Errores**: Registro detallado de errores
- **Respuestas de Error**: Mensajes informativos para usuarios

## 📊 Base de Datos

### Modelo de Cartera
```javascript
{
  discordId: String,        // ID único de Discord
  username: String,         // Nombre de usuario
  balance: Number,          // Balance actual
  promoCode: String,        // Código de referido propio
  usedPromoCode: String,    // Código usado al registrarse
  dineroApostado: Number,   // Total apostado
  transactions: [{          // Historial de transacciones
    type: String,           // Tipo de transacción
    amount: Number,         // Monto
    date: Date             // Fecha
  }]
}
```

### Modelo de Configuración de Tickets
```javascript
{
  guildId: String,              // ID del servidor
  ticketCategoryId: String,     // ID de la categoría de tickets
  staffRoleId: String,          // ID del rol de staff
  logChannelId: String,         // ID del canal de logs
  transcriptChannelId: String,  // ID del canal de transcripts
  createdAt: Date,             // Fecha de creación
  updatedAt: Date              // Fecha de última actualización
}
```

## 🔄 Mejoras Implementadas

### Refactorización del Código
- **Modularización**: Separación de responsabilidades en módulos
- **Utilidades**: Funciones reutilizables para validaciones y logging
- **Manejo de Errores**: Sistema robusto de manejo de errores
- **Documentación**: Comentarios y documentación mejorada
- **Limpieza**: Eliminación de código no relacionado con casino/tickets

### Optimizaciones
- **Consultas de Base de Datos**: Optimización de consultas MongoDB
- **Gestión de Memoria**: Limpieza automática de partidas de blackjack
- **Logs**: Sistema de logging centralizado y eficiente
- **Enfoque**: Bot enfocado únicamente en casino, tickets y base de datos

## 🚀 Uso

1. **Configurar el bot** con las variables de entorno necesarias
2. **Iniciar el bot** con `npm start`
3. **Configurar sistema de tickets** con `/configurartickets`
4. **Crear carteras** para usuarios con `/crear`
5. **Los usuarios pueden** usar `/cartera`, `/blackjack`, `/apostar`, etc.
6. **Sistema de tickets** disponible para soporte técnico

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:
1. Fork el proyecto
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia ISC.

## 🆘 Soporte

Para soporte técnico, usa el sistema de tickets del bot o contacta a los administradores del servidor.

---

**Desarrollado con ❤️ para la comunidad de GTAHub**
