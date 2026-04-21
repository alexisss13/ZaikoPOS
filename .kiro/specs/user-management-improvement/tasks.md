# Plan de Implementación - Mejora del Sistema de Gestión de Usuarios

## Exploración y Tests del Bug Condition

- [x] 1. Escribir test de exploración del bug condition
  - **Property 1: Bug Condition** - Modal Monolítico con Sobrecarga de UI
  - **CRÍTICO**: Este test DEBE FALLAR en código sin arreglar - el fallo confirma que el bug existe
  - **NO intentar arreglar el test o el código cuando falle**
  - **NOTA**: Este test codifica el comportamiento esperado - validará el arreglo cuando pase después de la implementación
  - **OBJETIVO**: Demostrar contraejemplos que evidencien la mala experiencia de usuario
  - **Enfoque PBT Acotado**: Para bugs determinísticos, acotar la propiedad a casos concretos de fallo para asegurar reproducibilidad
  - Test que el UserModal actual presenta más de 10 elementos de permiso simultáneamente cuando se abre para cualquier acción (CREATE_USER, EDIT_USER)
  - Test que el modal mezcla datos básicos con permisos granulares en una sola interfaz
  - Test que la experiencia móvil es deficiente debido a la longitud excesiva del modal
  - Ejecutar test en código SIN ARREGLAR
  - **RESULTADO ESPERADO**: Test FALLA (esto es correcto - prueba que el bug existe)
  - Documentar contraejemplos encontrados para entender la causa raíz
  - Marcar tarea completa cuando el test esté escrito, ejecutado y el fallo documentado
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2. Escribir tests de preservación de propiedades (ANTES de implementar el arreglo)
  - **Property 2: Preservation** - Funcionalidad Backend Intacta
  - **IMPORTANTE**: Seguir metodología de observación-primero
  - Observar comportamiento en código SIN ARREGLAR para operaciones que no involucran la UI del modal
  - Escribir property-based tests que capturen patrones de comportamiento observados de los Preservation Requirements
  - Property-based testing genera muchos casos de prueba para garantías más sólidas
  - Ejecutar tests en código SIN ARREGLAR
  - **RESULTADO ESPERADO**: Tests PASAN (esto confirma el comportamiento base a preservar)
  - Marcar tarea completa cuando los tests estén escritos, ejecutados y pasando en código sin arreglar
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

## Implementación de la Solución

- [x] 3. Arreglo para separación de responsabilidades en gestión de usuarios

  - [x] 3.1 Crear BasicUserModal simplificado
    - Crear `src/components/dashboard/BasicUserModal.tsx`
    - Implementar modal limpio solo con datos esenciales: nombre, email, contraseña, rol, sucursal, foto
    - Aplicar permisos automáticos por rol SIN mostrarlos en la interfaz
    - Mantener validaciones existentes (email único, campos requeridos)
    - Implementar diseño responsive consistente con el resto de la aplicación
    - Usar hooks especializados para manejo de estado
    - _Bug_Condition: isBugCondition(input) donde input.action IN ['CREATE_USER', 'EDIT_USER'] AND currentModalPresentsAllFields(input.modalState)_
    - _Expected_Behavior: Modal simple que solo presenta datos básicos sin permisos granulares visibles_
    - _Preservation: Mantener aplicación automática de permisos por rol y validaciones existentes_
    - _Requirements: 2.1, 2.3, 2.4, 2.5_

  - [x] 3.2 Crear PermissionsManager especializado
    - Crear `src/components/dashboard/PermissionsManager.tsx`
    - Implementar interfaz dedicada para gestión granular de permisos
    - Organizar permisos por categorías lógicas (Inventario, POS, Reportes, Privacidad)
    - Incluir búsqueda y filtrado de permisos
    - Implementar vista previa de cambios antes de aplicar
    - Mantener el diseño flat/iPhone Settings del modal actual
    - _Bug_Condition: isBugCondition(input) donde input.action = 'MANAGE_PERMISSIONS'_
    - _Expected_Behavior: Interfaz especializada separada para gestión de permisos granulares_
    - _Preservation: Mantener toda la lógica de permisos y validaciones existentes_
    - _Requirements: 2.2, 2.4, 2.5_

  - [x] 3.3 Crear hooks especializados para manejo de estado
    - Crear `src/components/dashboard/hooks/useBasicUserForm.ts`
    - Crear `src/components/dashboard/hooks/usePermissionsManager.ts`
    - Extraer lógica de estado del UserModal actual
    - Mantener compatibilidad con APIs existentes
    - Implementar validaciones y manejo de errores
    - _Preservation: Mantener toda la lógica de negocio y validaciones sin cambios_
    - _Requirements: 3.1, 3.2, 3.4_

  - [x] 3.4 Refactorizar página de usuarios para acciones diferenciadas
    - Modificar `src/app/(dashboard)/dashboard/users/page.tsx`
    - Agregar botón "Editar Datos" → Abre BasicUserModal
    - Agregar botón "Gestionar Permisos" → Abre PermissionsManager
    - Mantener botón "Editar" existente para compatibilidad temporal
    - Actualizar tabla para mostrar acciones diferenciadas
    - _Expected_Behavior: Interfaces separadas accesibles desde acciones específicas en la tabla_
    - _Preservation: Mantener funcionalidad de filtros, búsqueda y paginación existente_
    - _Requirements: 2.1, 2.2, 3.5, 3.6_

  - [x] 3.5 Crear tipos TypeScript para gestión de usuarios
    - Crear `src/components/dashboard/types/user-management.types.ts`
    - Definir interfaces para BasicUserData y PermissionsData
    - Mantener compatibilidad con UserData existente
    - Documentar tipos para mejor mantenibilidad
    - _Preservation: Mantener compatibilidad con tipos existentes_
    - _Requirements: Todos los requirements de implementación_

  - [x] 3.6 Verificar que el test de exploración del bug condition ahora pasa
    - **Property 1: Expected Behavior** - Interfaces Separadas y Especializadas
    - **IMPORTANTE**: Re-ejecutar el MISMO test de la tarea 1 - NO escribir un test nuevo
    - El test de la tarea 1 codifica el comportamiento esperado
    - Cuando este test pase, confirma que el comportamiento esperado se satisface
    - Ejecutar test de exploración del bug condition de la tarea 1
    - **RESULTADO ESPERADO**: Test PASA (confirma que el bug está arreglado)
    - _Requirements: Expected Behavior Properties del diseño_

  - [x] 3.7 Verificar que los tests de preservación siguen pasando
    - **Property 2: Preservation** - Funcionalidad Backend Intacta
    - **IMPORTANTE**: Re-ejecutar los MISMOS tests de la tarea 2 - NO escribir tests nuevos
    - Ejecutar property-based tests de preservación de la tarea 2
    - **RESULTADO ESPERADO**: Tests PASAN (confirma que no hay regresiones)
    - Confirmar que todos los tests siguen pasando después del arreglo (sin regresiones)

## Validación y Testing

- [x] 4. Tests unitarios de componentes
  - Test de renderizado de BasicUserModal con datos mínimos requeridos
  - Test de validación de formularios en ambas interfaces
  - Test de aplicación automática de permisos por rol en BasicUserModal
  - Test de responsive design en diferentes viewports
  - Test de manejo de errores y estados de carga
  - _Requirements: 2.1, 2.2, 2.4_

- [ ] 5. Tests de integración de flujos completos
  - Test de flujo: registro básico → verificación en tabla → gestión de permisos
  - Test de switching entre interfaces sin pérdida de datos
  - Test de que los cambios se reflejan correctamente en la tabla de usuarios
  - Test de notificaciones y feedback visual en ambas interfaces
  - Test de compatibilidad con diferentes roles de usuario (SUPER_ADMIN, MANAGER)
  - _Requirements: 2.1, 2.2, 2.5, 3.1, 3.2, 3.3_

- [ ] 6. Checkpoint - Validación completa de la solución
  - Verificar que todos los tests pasan (exploración, preservación, unitarios, integración)
  - Confirmar que la experiencia de usuario ha mejorado significativamente
  - Validar que no se han introducido regresiones en funcionalidad existente
  - Verificar responsive design en dispositivos móviles y desktop
  - Confirmar consistencia visual con el resto de la aplicación
  - Preguntar al usuario si surgen dudas o se requieren ajustes adicionales
  - _Requirements: Todos los requirements de la especificación_

## Notas de Implementación

### Orden Crítico de Tareas
Las tareas DEBEN ejecutarse en el orden especificado:
1. **Tests de Exploración** (ANTES del arreglo) - Confirman que el bug existe
2. **Tests de Preservación** (ANTES del arreglo) - Establecen línea base de funcionalidad
3. **Implementación** - Aplicar el arreglo con entendimiento del problema
4. **Validación** - Verificar que el arreglo funciona y no rompe nada

### Metodología Bug Condition
- **C(X)**: Bug Condition - Modal monolítico que mezcla responsabilidades
- **P(result)**: Property - Interfaces separadas y especializadas
- **¬C(X)**: Operaciones que no involucran la UI del modal
- **F**: UserModal actual (sin arreglar)
- **F'**: BasicUserModal + PermissionsManager (arreglado)

### Consideraciones Técnicas
- Mantener compatibilidad temporal con UserModal existente
- Usar property-based testing para garantías sólidas de preservación
- Implementar migración gradual para minimizar riesgo
- Documentar cambios para facilitar mantenimiento futuro