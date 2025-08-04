# Browser Debugging Guide for Robot Masters Web Viewer

## Overview

The web viewer includes comprehensive debugging tools for troubleshooting WASM integration, game state, and rendering issues.

## Debugging Features

### 1. Visual Debug Panel

A floating debug panel is available in the bottom-right corner of the screen:

- **Status Indicators**: Shows WASM and game initialization status
- **Frame Controls**: Step through frames manually
- **State Dumping**: Dump game state, characters, and spawns to console
- **Health Monitoring**: Check WASM wrapper health
- **Debug Log**: Real-time logging of operations

### 2. Browser Console Tools

After loading a configuration, debugging tools are available globally via `window.robotMastersDebug`:

```javascript
// Dump complete game state to console
window.robotMastersDebug.dumpState()

// Dump character data with detailed info
window.robotMastersDebug.dumpCharacters()

// Dump spawn data
window.robotMastersDebug.dumpSpawns()

// Step one frame manually
window.robotMastersDebug.stepFrame()

// Get WASM health information
window.robotMastersDebug.getHealthInfo()

// Enable verbose logging for all operations
window.robotMastersDebug.enableVerboseLogging()

// Disable verbose logging
window.robotMastersDebug.disableVerboseLogging()
```

### 3. Error Handling

- **Visual Error Display**: Errors appear in red banners at the top of the screen
- **Detailed Error Info**: WASM wrapper provides detailed error information via `get_last_error_details()`
- **Error State Management**: Errors are managed through Jotai atoms and can be cleared

### 4. Console Logging

The application logs important events:

- WASM initialization status
- Configuration loading results
- Game state updates (when verbose logging is enabled)
- Frame stepping operations
- Error details with context

## Debugging Workflows

### Debugging WASM Loading Issues

1. Check browser console for WASM initialization errors
2. Use the debug panel to verify WASM status
3. Call `window.robotMastersDebug.getHealthInfo()` to check wrapper health

### Debugging Configuration Issues

1. Load a configuration and check for error banners
2. Use `window.robotMastersDebug.dumpState()` to verify the loaded state
3. Check the debug panel for game initialization status

### Debugging Game State Issues

1. Enable verbose logging: `window.robotMastersDebug.enableVerboseLogging()`
2. Step through frames manually using the debug panel or console
3. Dump specific data: characters, spawns, or full state
4. Monitor the debug log in the panel for real-time updates

### Debugging Rendering Issues

1. Use `window.robotMastersDebug.dumpCharacters()` to verify character positions
2. Check spawn data with `window.robotMastersDebug.dumpSpawns()`
3. Monitor frame updates in the debug panel
4. Verify game state consistency across frames

## Common Issues and Solutions

### WASM Not Loading

- Check browser console for module loading errors
- Verify the WASM file is accessible (check Network tab)
- Ensure the WASM wrapper package is properly installed

### Configuration Validation Errors

- Use the WASM wrapper's built-in validation
- Check the error details for specific validation failures
- Verify JSON syntax and required fields

### Game State Not Updating

- Check if the game is properly initialized
- Verify frame stepping is working
- Use verbose logging to monitor state changes

### Performance Issues

- Monitor frame stepping performance
- Check for memory leaks in WASM operations
- Use browser DevTools Performance tab

## Development Tips

1. **Use the Debug Panel**: It provides quick access to common debugging operations
2. **Enable Verbose Logging**: Helpful for understanding frame-by-frame changes
3. **Check Health Info**: The WASM wrapper provides stability information
4. **Manual Frame Stepping**: Useful for debugging specific game logic
5. **Console Grouping**: Debug output is organized in collapsible groups

## Browser DevTools Integration

The debugging tools work seamlessly with browser DevTools:

- **Console**: All debug output appears in the browser console
- **Network**: Monitor WASM file loading
- **Performance**: Profile frame stepping and rendering
- **Memory**: Monitor WASM memory usage
- **Sources**: Debug TypeScript/JavaScript code with source maps

## Example Debugging Session

```javascript
// 1. Load configuration and check status
// (Use the UI to load a config)

// 2. Enable verbose logging
window.robotMastersDebug.enableVerboseLogging()

// 3. Step a few frames and monitor output
window.robotMastersDebug.stepFrame()
window.robotMastersDebug.stepFrame()
window.robotMastersDebug.stepFrame()

// 4. Dump current state
window.robotMastersDebug.dumpState()

// 5. Check character positions
window.robotMastersDebug.dumpCharacters()

// 6. Monitor health
window.robotMastersDebug.getHealthInfo()
```

This comprehensive debugging setup should help identify and resolve issues quickly during development and testing.
