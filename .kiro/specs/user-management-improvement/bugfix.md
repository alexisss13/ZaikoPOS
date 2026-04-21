# Especificación de Bugfix: Mejora del Sistema de Gestión de Usuarios

## Introducción

El sistema actual de gestión de usuarios presenta problemas significativos de experiencia de usuario y organización lógica. El modal de registro/edición de usuarios es excesivamente largo y complejo, mezclando datos básicos del usuario con configuración granular de permisos, lo que resulta en una experiencia confusa y poco profesional. Esta mejora busca separar las responsabilidades, crear un flujo más intuitivo y mantener la consistencia visual con el resto de la aplicación.

## Análisis del Bug

### Comportamiento Actual (Defecto)

1.1 CUANDO un usuario intenta registrar nuevo personal ENTONCES el sistema presenta un modal único extremadamente largo que mezcla datos básicos (nombre, email, rol) con permisos granulares (más de 14 switches de permisos)

1.2 CUANDO un usuario necesita gestionar permisos de un empleado existente ENTONCES el sistema obliga a abrir el modal completo de edición con todos los campos básicos, haciendo el proceso lento e ineficiente

1.3 CUANDO se selecciona un rol (MANAGER, CASHIER) ENTONCES el sistema aplica permisos predeterminados pero los muestra inmediatamente en el mismo modal, creando confusión sobre qué es automático y qué es personalizable

1.4 CUANDO el modal se abre en dispositivos móviles o pantallas pequeñas ENTONCES la interfaz se vuelve difícil de navegar debido a la cantidad excesiva de contenido en un solo modal

1.5 CUANDO se compara con otras secciones (productos, inventario) ENTONCES la gestión de usuarios no sigue el mismo patrón de diseño limpio y separación de responsabilidades

### Comportamiento Esperado (Correcto)

2.1 CUANDO un usuario intenta registrar nuevo personal ENTONCES el sistema SHALL presentar un modal simple y limpio que solo contenga datos esenciales (nombre, email, contraseña, rol, sucursal) sin permisos granulares

2.2 CUANDO un usuario necesita gestionar permisos de un empleado existente ENTONCES el sistema SHALL proporcionar una interfaz separada y especializada para la gestión de permisos, accesible desde la tabla de usuarios

2.3 CUANDO se selecciona un rol (MANAGER, CASHIER) ENTONCES el sistema SHALL aplicar permisos predeterminados automáticamente sin mostrarlos en el modal de registro, manteniendo la simplicidad del flujo inicial

2.4 CUANDO el modal se abre en cualquier dispositivo ENTONCES la interfaz SHALL ser completamente responsive y fácil de navegar, con contenido enfocado y organizado

2.5 CUANDO se compara con otras secciones del sistema ENTONCES la gestión de usuarios SHALL seguir el mismo patrón de diseño consistente con modales simples para acciones básicas

### Comportamiento Sin Cambios (Prevención de Regresiones)

3.1 CUANDO se crean usuarios con roles específicos ENTONCES el sistema SHALL CONTINUAR aplicando los permisos predeterminados correctos según el rol asignado

3.2 CUANDO se editan datos básicos de usuarios existentes ENTONCES el sistema SHALL CONTINUAR permitiendo la modificación de nombre, email, rol y sucursal sin afectar permisos existentes

3.3 CUANDO usuarios con diferentes roles acceden al sistema ENTONCES el sistema SHALL CONTINUAR respetando las restricciones de acceso y visibilidad según el rol del usuario actual

3.4 CUANDO se realizan operaciones CRUD en usuarios ENTONCES el sistema SHALL CONTINUAR validando correctamente los datos y manteniendo la integridad referencial

3.5 CUANDO se muestran usuarios en la tabla principal ENTONCES el sistema SHALL CONTINUAR mostrando toda la información relevante (rol, sucursal, estado) de manera clara y organizada

3.6 CUANDO se aplican filtros y búsquedas ENTONCES el sistema SHALL CONTINUAR funcionando correctamente sin afectar el rendimiento o la precisión de los resultados