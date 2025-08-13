# Solución para el Error de Azure MSAL con NPX

## Problema

Cuando usas `npx mcpql` desde GitHub, puedes encontrar este error:

```
Error: Cannot find module './index-node-CtW_2rqJ.js'
Require stack:
- C:\Users\...\node_modules\@azure\msal-common\lib\index.cjs
```

## Causa

Este es un problema conocido con las dependencias de Azure MSAL cuando se instalan a través de npx. Los módulos de Azure tienen dependencias internas que no se resuelven correctamente en el cache de npx.

## Soluciones

### Opción 1: Instalación Global (Recomendada)

```bash
npm install -g mcpql
mcpql
```

### Opción 2: Usar NPX con Flag --yes

```bash
npx --yes mcpql
```

### Opción 3: Limpiar Cache de NPX

```bash
npm cache clean --force
# En Windows PowerShell:
Remove-Item -Recurse -Force "$env:LOCALAPPDATA\npm-cache\_npx" -ErrorAction SilentlyContinue
```

### Opción 4: Script Automático de Reparación

Ejecuta el script incluido en el proyecto:

```bash
npm run fix-npx
```

O directamente:

```powershell
./_Guide/fix_npx_azure_msal_issue.ps1
```

### Opción 5: Usar Versión NPX Compatible

Si tienes el código fuente:

```bash
npm run start:npx
```

## Verificación

Después de aplicar cualquiera de las soluciones, verifica que funciona:

```bash
mcpql --version
```

## Notas Técnicas

- El problema está relacionado con la forma en que npx maneja las dependencias transitivas de Azure
- Las versiones más recientes de npm y Node.js han mejorado este comportamiento
- La instalación global evita completamente el problema del cache de npx

## Soporte

Si ninguna de estas soluciones funciona, por favor:

1. Reporta el issue en GitHub
2. Incluye tu versión de Node.js (`node --version`)
3. Incluye tu versión de npm (`npm --version`)
4. Incluye el error completo