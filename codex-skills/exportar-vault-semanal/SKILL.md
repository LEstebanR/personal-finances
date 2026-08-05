---
name: exportar-vault-semanal
description: Exporta cada semana los documentos Markdown relevantes de un vault para alimentar un proyecto. Úsala cuando se necesite recopilar notas nuevas o modificadas, excluir información sensible y generar un paquete reproducible de contexto.
---

# Exportar vault semanal

Prepara una fotografía completa y versionada de documentos Markdown del vault para que otro proyecto o asistente conserve contexto a lo largo del tiempo. Conserva el vault original sin modificaciones y exporta únicamente copias filtradas.

## Flujo

1. Identificar la ruta del vault y la carpeta de destino del proyecto. Si faltan, pedirlas; nunca asumir que la carpeta actual es el vault.
2. Confirmar el período. Por defecto, marcar como recientes los archivos Markdown modificados en los últimos 7 días. La fotografía semanal incluye todos los documentos permitidos para conservar contexto amplio; `--since` solo define qué archivos aparecen como cambios recientes.
3. Excluir `.obsidian/`, `.git/`, `node_modules/`, carpetas de exportación y archivos cuyo nombre o ruta sugiera secretos, credenciales, contraseñas, tokens o claves.
4. Ejecutar el script incluido:

   ```bash
   python3 scripts/export_vault.py \
     --source /ruta/al/vault \
     --destination /ruta/al/proyecto/context/weekly \
     --since 2026-08-01 \
     --snapshot-date 2026-08-05
   ```

5. Revisar el resumen generado: número de documentos, archivos excluidos y rutas de salida. Si el paquete contiene secretos o archivos inesperados, detenerse y pedir revisión.
6. Entregar el snapshot con `INDEX.md` y `manifest.json`, y revisar `HISTORY.md` en la raíz. `INDEX.md` separa los cambios recientes del vault completo; `HISTORY.md` permite navegar las fotografías anteriores.

## Reglas de exportación

- No borrar ni editar archivos del vault.
- Mantener las rutas relativas originales para conservar enlaces y contexto.
- Crear una carpeta inmutable `YYYY-MM-DD/` por semana dentro de la carpeta de destino. No reutilizar una fecha existente: usar otra fecha o corregir manualmente solo si el usuario lo solicita.
- Mantener `HISTORY.md` en la raíz para registrar cada snapshot.
- No exportar archivos ocultos ni extensiones distintas de `.md` salvo que el usuario lo pida.
- No incluir contenido de secretos aunque el archivo haya sido modificado durante la semana.
- No hacer commit, push, sincronización remota ni envío a ChatGPT automáticamente; esas acciones requieren una instrucción separada.

## Recursos

El script `scripts/export_vault.py` realiza la selección, copia e inventario de documentos de forma determinista.
