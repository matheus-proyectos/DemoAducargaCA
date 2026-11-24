# Manual de Uso - Administrador
## ADUCARGA - Plataforma de Rastreo de Envíos

### 1. Acceso al Sistema
- URL: `https://aducarga.com/admin`
- Usuario: `admin@aducarga.test` (demo) o correo real registrado con rol admin
- Contraseña: `Admin2026!` (demo) o la contraseña registrada

### 2. Dashboard Principal
- Panel general con estadísticas de envíos
- Acceso rápido a funciones clave

### 3. Gestión de Paquetes
- Ver todos los paquetes del sistema
- Crear nuevos paquetes
- Editar información del paquete
- Eliminar paquetes (solo admin)
- Asignar paquetes a clientes

### 4. Gestión de Clientes
- Listar todos los clientes
- Crear nuevos clientes
- Editar información de clientes
- Asignar roles (cliente/operador/admin)
- Ver actividad del cliente

### 5. Gestión de Embarques
- Crear embarques
- Asignar paquetes a embarques
- Registrar movimientos de embarque
- Actualizar estados de embarque

### 6. Gestión de Estados
- Configurar estados notificables
- Definir mensajes de notificación
- Asignar colores/íconos a estados
- Configurar triggers automáticos

### 7. Notificaciones
- Ver historial de notificaciones
- Configurar webhooks (n8n/Make)
- Probar integraciones
- Revisar errores de envío

### 8. Auditoría
- Ver registro de acciones
- Exportar logs
- Revisar actividad sospechosa

### 9. Configuración del Sistema
- Variables de entorno
- Configuración de cron
- Configuración de seguridad

### 10. Troubleshooting
- Error de autenticación: verificar credenciales
- Error de base de datos: verificar variables de Supabase
- Error de cron: verificar CRON_SECRET
- Error de redirecciones: verificar NEXT_PUBLIC_SITE_URL