<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# SDF Liquid Editor

A browser-based Three.js playground for building liquid-style SDF forms with real-time raymarching booleans.

## Run locally

**Prerequisites:** Node.js 18+

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the dev server:
   ```bash
   npm run dev
   ```
3. Open the URL printed by Vite (typically `http://localhost:5173`).

## Browser playground controls

- **Orbit camera:** drag to rotate, scroll to zoom.
- **Move / Scale:** choose transform mode in the right panel.
- **Add Shape:** choose `Sphere`, `Box`, or `Cylinder`, then choose boolean mode:
  - `Union` to add liquid volume
  - `Subtract / Hole` to carve holes
- **Smoothness slider:** controls blending softness between SDF primitives.
- **Union Text:** converts text input into a metaball-style blob chain and unions it into the form.
- **Primitive list:** select a primitive, then:
  - **Toggle Union/Subtract**
  - **Delete**

## 2-minute smoke test checklist

Use this click path to quickly validate the editor:

1. Launch with `npm run dev` and confirm the editor loads.
2. Verify the initial two-sphere liquid blob is visible.
3. Click **Add Shape** with `Sphere + Union` and confirm the blob grows.
4. Select `Cylinder + Subtract / Hole`, click **Add Shape**, and confirm a visible carved region appears.
5. Select the new primitive in the list and click **Move**; drag gizmo and confirm live updates.
6. Switch to **Scale** mode and resize the selected primitive.
7. Drag **Smoothness** from low to high and confirm blending changes.
8. Enter text (e.g. `TEST`) and click **Union Text**; confirm added blob chain appears.
9. Select any primitive and click **Toggle Union/Subtract**; confirm geometry flips behavior.
10. Select a primitive and click **Delete**; confirm it is removed from the list and scene.

## Build

```bash
npx vite build
```

> Note: `npm run build` currently runs `tsc && vite build` and may fail in this repo due to an existing TypeScript config mismatch around `vite.config.ts` declarations.
