## 📂 Phase 4: Structural Cleanliness

**Objective:** Clean up the root directory by organizing native and data assets.

### Proposed Structure:

- `native/`: C++ source and headers (`.cpp`, `.hpp`, `Makefile`).
- `data/`: Opening books and static resources (`.book`, `.data`).
- `src/`: TypeScript wrapper and logic.
- `Root`: Config files only (`package.json`, `tsconfig.json`, etc.).

### Tasks:

- [ ] Move C++ files to `native/`.
- [ ] Move books to `data/`.
- [ ] Update `build.sh` and `src/index.test.ts` paths.
- [ ] Update `README.md` documentation.
