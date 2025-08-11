# Direction Indicator Fix Summary

## Problem Analysis

The direction indicator in the web viewer was not updating to reflect the character's current facing direction during turn-around behavior.

## Investigation Results

### ✅ Game Engine (Working Correctly)

- Direction values change correctly: `dir[0]` changes from 2 (right) to 0 (left) around frame 97
- Turn-around behavior works as expected
- Character bounces between walls with proper direction changes

### ✅ WASM Integration (Working Correctly)

- `wasmLoader.ts` correctly reads `char.dir[0]` as the facing direction
- Character data is properly transformed: `facing: char.dir[0]`

### ✅ Direction Mapping (Working Correctly)

- FacingIndicator component correctly maps direction values:
  - 0 → left side (x=2)
  - 1 → center (x=width/2)
  - 2 → right side (x=width-2)

### ❌ React PIXI Graphics Update (The Issue)

- PIXI Graphics components don't always re-render when props change
- This is a known issue with React PIXI where Graphics components can be "sticky"

## Solution Applied

### Fix 1: Force Graphics Re-render

```typescript
// Before (not updating):
return <Graphics draw={drawIndicator} />

// After (forces update):
return <Graphics key={`facing-${facing}`} draw={drawIndicator} />
```

The `key` prop forces React to create a new Graphics component instance when the facing direction changes, ensuring the indicator updates correctly.

### Fix 2: Added Debug Logging

```typescript
// Debug character facing direction changes
useEffect(() => {
  if (characters && characters.length > 0) {
    const char = characters[0]
    console.log(
      `Character facing direction = ${char.facing} (${
        char.facing === 0
          ? 'left'
          : char.facing === 1
          ? 'neutral'
          : char.facing === 2
          ? 'right'
          : 'unknown'
      })`
    )
  }
}, [characters])
```

This helps verify that the character data is being updated correctly in the web viewer.

## Testing Instructions

1. **Check existing web viewer instance** (don't start a new dev server)
2. **Load a configuration with turn-around behavior** (like COMBINATION_1)
3. **Watch the character move and hit walls**
4. **Verify the direction indicator updates**:
   - When character faces right: white dot should be on the right side of character
   - When character faces left: white dot should be on the left side of character
5. **Check browser console** for debug logs showing direction changes

## Expected Behavior After Fix

- ✅ Direction indicator updates immediately when character turns around
- ✅ White dot moves from right side to left side (and vice versa) when direction changes
- ✅ Indicator accurately reflects character's current facing direction
- ✅ No lag or delay in indicator updates

## Files Modified

- `web-viewer/src/components/GameCanvas.tsx`:
  - Added `key` prop to force Graphics re-render
  - Added debug logging for direction changes

## Root Cause

The issue was not with the game logic, WASM integration, or direction mapping. It was specifically a React PIXI rendering issue where Graphics components weren't updating when their props changed. The `key` prop solution forces React to create a new component instance, ensuring the visual update occurs.

This is a common pattern when working with imperative graphics libraries (like PIXI) within declarative frameworks (like React).
