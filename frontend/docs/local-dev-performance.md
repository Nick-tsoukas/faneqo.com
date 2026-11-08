# Local Development Performance Tips

This guide helps you run the MusicBizQR project on a low-RAM Windows PC.

## Quick Tips

### 1. Open Only This Folder
- Open **only** the `qr` frontend folder in Windsurf/VS Code
- Do **not** open the parent/master folder containing multiple projects
- This prevents the editor from indexing unnecessary files

### 2. Run Only What You Need
- Run **only Nuxt** when working on frontend: `npm run dev`
- Avoid running Strapi locally unless you need to test backend changes
- Use the **production/Railway Strapi API** when possible (check `.env` for `STRAPI_URL`)

### 3. Browser Management
- Keep Chrome to **3-5 tabs max**
- Close DevTools when not actively debugging
- Use a single browser window for testing

### 4. When Things Get Slow

If the language server spikes memory:
1. Open Command Palette (`Ctrl+Shift+P`)
2. Run: `TypeScript: Restart TS Server`
3. Or run: `Developer: Reload Window`

### 5. Search Wisely
- Avoid global searches (`Ctrl+Shift+F`) over the whole project
- Use file-specific search (`Ctrl+F`) when possible
- The `.vscode/settings.json` already excludes `node_modules`, `.nuxt`, etc. from search

### 6. Close Unused Files
- Close files you're not actively editing
- Use `Ctrl+K W` to close all editors in a group
- Enable "Preview Mode" (already set in settings) to avoid opening too many tabs

## What's Already Optimized

The `.vscode/settings.json` file includes:

- **Watcher exclusions**: `node_modules`, `.nuxt`, `.output`, etc. are not watched
- **Search exclusions**: Heavy folders excluded from search
- **TS Server memory cap**: Limited to 512MB
- **Disabled features**: CodeLens, minimap, inlay hints, auto-imports

## Recommended Workflow

1. Start Windsurf
2. Open only the `qr` folder
3. Wait for indexing to complete (watch bottom status bar)
4. Run `npm run dev` in terminal
5. Test in browser with minimal tabs
6. If sluggish, restart TS server or reload window

## Memory Usage Targets

| Process | Target | Warning |
|---------|--------|---------|
| Windsurf | < 800MB | > 1.2GB |
| Node/Nuxt | < 400MB | > 600MB |
| Chrome | < 1GB | > 1.5GB |
| Total System | < 80% | > 90% |

## Emergency: System Freezing

1. Close Chrome first (biggest memory hog)
2. Stop the Nuxt dev server (`Ctrl+C` in terminal)
3. Close Windsurf
4. Open Task Manager and end any lingering `node.exe` processes
5. Restart Windsurf and open only essential files
