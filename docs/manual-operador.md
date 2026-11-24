# Manual de Uso - Operador
## ADUCARGA - Plataforma de Rastreo de Envíos

### 1. Acceso al Sistema
- URL: `https://aducarga.com/rastreo`
- Usuario: `operador@aducarga.test` (demo) o correo real con rol operador
- Contraseña: `Operador2026!` (demo) o la contraseña registrada

### 2. Funciones Disponibles
- Ver lista de paquetes asignados al operador
- Actualizar estado de envíos
- Registrar movimientos individuales
- Crear embarques y asignar paquetes
- Ver clientes asociados a los paquetes

### 3. Restricciones
- No puede ver paquetes que no están asignados a él
- No puede modificar roles o configuración del sistema
- No puede eliminar paquetes

### 4. Flujo de Trabajo
1. Iniciar sesión
2. Ver paquetes activos en su panel
3. Actualizar estado del envío
4. Registrar movimiento con ubicación y observaciones
5. Enviar notificación al cliente (automática)

### 5. Verificación
- Confirmar estado del envío actualizado
- Verificar que el cliente recibió notificación
- Confirmar que el estado se refleja en el tracking

### 6. Troubleshooting
- Error de notificación: verificar webhook o reiniciar cron
- Error de actualización: verificar conexión con base de datos