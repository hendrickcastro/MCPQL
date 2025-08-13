# Fix NPX Cache Issues

## Problema
Cuando se actualiza un paquete en GitHub y se usa con `npx`, npm puede usar una versión cacheada corrupta.

## Soluciones

### 1. Limpiar cache de npm (Usuario final)
```bash
# Limpiar todo el cache
npm cache clean --force

# O usar npx con --force para evitar cache
npx --force hendrickcastro/mcpql
```

### 2. Usar commit específico
En lugar de usar el branch main, usar un commit específico:
```json
{
  "mcpql": {
    "command": "npx",
    "args": [
      "-y",
      "git+https://github.com/hendrickcastro/mcpql.git#commit-hash"
    ]
  }
}
```

### 3. Publicar en npm registry
La mejor solución a largo plazo es publicar el paquete en npm registry:
```bash
npm publish
```

### 4. Usar tag específico
```bash
git tag v1.0.1
git push origin v1.0.1
```

Luego usar:
```json
"git+https://github.com/hendrickcastro/mcpql.git#v1.0.1"
```
